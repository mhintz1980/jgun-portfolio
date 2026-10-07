"""G0 tool clearance v4 (meridian method), parent-authored 2026-10-05.

Replaces the defective clearance-v3 verdict (collapsed cutter profile inflated
e_tool to 2.749 mm; hob fed from the journal side). Method:

* Both shafts rotate during machining (shaping generation, hobbing), so every
  non-generated feature (pilot, relief groove, cone, journal, ring groove,
  shoulder) is checked against the surface-of-revolution envelope
  r_outer(y) = max radius of the exact plane section at y. Shaft region at y is
  contained in rho <= r_outer(y), so clearance is a 2D distance in the meridian
  half-plane (rho, y). No ray parity or normal signs on open shells.
* Tooth-space floor r_min(y) = min radius of the section (segment interior
  included) is used only for the hob ramp reproduction check.
* Shaper (legacy grooved blank): disc cutter axis parallel to the shaft axis,
  so its meridian footprint is the exact rectangle rho in [C-Rt, C+Rt] x
  [yc-t/2, yc+t/2]; holders likewise. Contact is allowed only in the measured
  generating band (face start .. last tooth stub).
* Hob (revised smooth blank, then approved journal side): tilted cylinder of
  radius R about axis a=(cos g, sin g, 0) through (0, yc, A); near-side surface
  sampled densely; R and stop position fitted to the approved ramp floor.
* e_total = e_cad + e_profile + e_sampling (+ e_path for path poses). PASS for
  must-clear pairs requires d - e_total >= MARGIN; contact pairs require
  |penetration| <= e_total and location inside the generated zone.

Read-only on all CAD sources (hashes checked before/after). Writes only
camera/clearance-v4/.
"""
import hashlib
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path

import bpy
import bmesh
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05"
OUT = EV / "camera" / "clearance-v4"
OUT.mkdir(parents=True, exist_ok=True)
LOG = (OUT / "run.log").open("w", encoding="utf-8")
BLEND = Path(r"C:\Projects\CAD\jgun-input-shaft-hobbed\shifted\input-shaft-assembly-parts-v1.blend")
BLEND_SHA = "88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89"
COMMAND = ('& "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --factory-startup '
           '--python-exit-code 1 --python scripts/manufacturing/tool_clearance_meridian.py')

TIP_R, ROOT_R = 6.0834, 4.2918
FACE_START, FACE_END, RAMP_END, JOURNAL_Y = 3.1749, 9.5249, 13.78, 14.18
EPS_STOCK, MARGIN = 0.005, 0.02
H = 0.01  # profile step, mm
Y_LO, Y_HI = -0.2, 24.0
# Shaper: matched conjugate candidate from camera/profile-study (N=20, C=15.5).
N_SHAPER, SHAPER_C, SHAPER_T = 20, 15.5, 1.2
SHAPER_RT = SHAPER_C - (ROOT_R + EPS_STOCK)
SHAPER_BACKOFF = 2.0
HOLDERS = {"hub": (8.0, 6.0), "clamp_nut": (9.0, 3.0), "arbor": (7.0, 12.0)}  # radius, length (trailing, -Y)
# Hob: single start, normal module 1, work pitch radius 5.0.
HOB_M, HOB_LEN, HOB_RETRACT = 1.0, 16.0, 2.5
COLLAR_R, COLLAR_W, ARBOR_R, ARBOR_L = None, 3.0, None, 12.0
E_CAD = 0.002

T0 = time.time()


def log(msg):
    line = "[%7.1fs] %s" % (time.time() - T0, msg)
    print(line, flush=True)
    LOG.write(line + "\n")
    LOG.flush()


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


if sha256(BLEND) != BLEND_SHA:
    raise SystemExit("HASH_MISMATCH_BEFORE")
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
deps = bpy.context.evaluated_depsgraph_get()


def mesh_mm(name):
    ob = bpy.data.objects[name]
    assert np.abs(np.array(ob.matrix_world) - np.eye(4)).max() < 1e-9
    me = ob.evaluated_get(deps).to_mesh()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    V = np.array([v.co[:] for v in bm.verts], dtype=float) * 1000.0
    F = np.array([[v.index for v in f.verts] for f in bm.faces], dtype=np.int64)
    bm.free()
    ob.to_mesh_clear()
    return V, F


def profiles(V, F):
    """Exact plane sections every H mm: r_outer (max radius) and r_min (min radius)."""
    ys = np.round(np.arange(Y_LO, Y_HI + 1e-9, H), 6)
    tri_y = V[F][:, :, 1]
    lo, hi = tri_y.min(1), tri_y.max(1)
    order = np.argsort(lo)
    lo_s = lo[order]
    r_out = np.zeros(len(ys))
    r_min = np.full(len(ys), np.nan)
    # Offset planes 0.23 um so no section plane coincides with (float32-noisy) mesh vertices.
    for i, y0 in enumerate(ys + 2.3e-4):
        cand = order[: np.searchsorted(lo_s, y0, side="right")]
        cand = cand[hi[cand] >= y0]
        if len(cand) == 0:
            continue
        T = V[F[cand]]
        d = T[:, :, 1] - y0
        d[np.abs(d) < 1e-9] = 1e-9
        pts = []
        for a, b in ((0, 1), (1, 2), (2, 0)):
            m = d[:, a] * d[:, b] < 0
            t = d[m, a] / (d[m, a] - d[m, b])
            P = T[m, a] + (T[m, b] - T[m, a]) * t[:, None]
            pts.append((np.nonzero(m)[0], P[:, [0, 2]]))
        ids = np.concatenate([p[0] for p in pts])
        P = np.vstack([p[1] for p in pts])
        if len(P) == 0:
            continue
        r_out[i] = np.hypot(P[:, 0], P[:, 1]).max()
        srt = np.argsort(ids, kind="stable")
        ids, P = ids[srt], P[srt]
        pair = np.nonzero(ids[1:] == ids[:-1])[0]
        A, B = P[pair], P[pair + 1]
        E = B - A
        ee = np.maximum((E ** 2).sum(1), 1e-18)
        tt = np.clip(-(A * E).sum(1) / ee, 0, 1)
        r_min[i] = np.hypot(*(A + tt[:, None] * E).T).min()
    # Interior empty stations (seams): fill from neighbours, counted in the report.
    nz = np.nonzero(r_out)[0]
    filled = 0
    for i in range(nz[0] + 1, nz[-1]):
        if r_out[i] == 0:
            r_out[i] = max(r_out[i - 1], r_out[i + 1])
            filled += 1
    FILLED.append(filled)
    # Conservative envelope: max over the neighbouring samples (covers steps between planes).
    r_dil = np.maximum(r_out, np.maximum(np.roll(r_out, 1), np.roll(r_out, -1)))
    r_dil[0], r_dil[-1] = max(r_out[0], r_out[1]), max(r_out[-1], r_out[-2])
    return ys, r_out, r_dil, r_min


FILLED = []
LEG = profiles(*mesh_mm("SHAFT_P001835_ORIG"))
APP = profiles(*mesh_mm("SHAFT_P001835_HOBBED_NEW"))
log("profiles: %d stations each" % len(LEG[0]))
YS = LEG[0]


def at(prof, y):
    return prof[int(round((y - Y_LO) / H))]


def first_y(cond, start, stop, step=H):
    for y in np.arange(start, stop, step):
        if cond(round(float(y), 6)):
            return round(float(y), 6)
    return None


# ------------------------------------------------------------------ profile facts
leg_ro, leg_rd, leg_rmin = LEG[1], LEG[2], LEG[3]
app_ro, app_rd, app_rmin = APP[1], APP[2], APP[3]
rho_cut = SHAPER_C - SHAPER_RT  # cutter near radius at full depth
for yy in np.arange(-0.2, 22.0, 0.25):
    log("PROFILE y=%6.2f legacy ro=%.4f rmin=%.4f | approved ro=%.4f rmin=%.4f"
        % (yy, at(leg_ro, yy), at(leg_rmin, yy), at(app_ro, yy), at(app_rmin, yy)))
# Last tooth material: first station past the face where nothing stands above root radius.
teeth_end = first_y(lambda y: at(leg_rd, y) <= ROOT_R, FACE_END - 1.0, 16.0)
gmask = (YS > teeth_end) & (YS < teeth_end + 1.6)
groove_floor_y = float(YS[gmask][np.argmin(leg_ro[gmask])])
groove_end = first_y(lambda y: at(leg_rd, y) >= rho_cut - 0.05, groove_floor_y, 20.0)
edge_end = first_y(lambda y: at(leg_rd, y) < ROOT_R - 0.1, teeth_end, groove_floor_y + H)
pilot_end = first_y(lambda y: at(leg_rd, y) >= rho_cut - 0.05, 0.0, FACE_START + 1.0)
facts = {
    "legacy_teeth_end_y": teeth_end, "legacy_groove_edge_end_y": edge_end, "legacy_groove_floor_y": groove_floor_y,
    "legacy_groove_floor_r": float(at(leg_ro, groove_floor_y)), "legacy_groove_wall_y": groove_end,
    "legacy_pilot_end_y": pilot_end,
    "empty_interior_stations_filled_legacy_approved": FILLED,
    "legacy_face_tip_r": float(leg_ro[(YS > 4) & (YS < 9)].max()),
    "approved_face_root_r": float(np.nanmin(app_rmin[(YS > 4) & (YS < 9)])),
    "approved_journal_r_at_14_18": float(at(app_ro, JOURNAL_Y)),
    "approved_r_outer_13_78_to_14_18": [float(app_ro[(YS >= RAMP_END) & (YS <= JOURNAL_Y)].min()),
                                        float(app_ro[(YS >= RAMP_END) & (YS <= JOURNAL_Y)].max())],
}
log("facts " + json.dumps(facts))
E_PROFILE = H / 2  # discrete union of meridian segments vs continuous profile
# Measured CAD constancy on nominally constant features (tessellation/export noise), added to e_cad.
_spans = {
    "approved_journal_r_outer_15_6_19_2": np.ptp(app_ro[(YS >= 15.6) & (YS <= 19.2)]),
    "legacy_journal_r_outer_12_9_16_5": np.ptp(leg_ro[(YS >= 12.9) & (YS <= 16.5)]),
    "approved_tip_r_outer_4_9": np.ptp(app_ro[(YS >= 4.0) & (YS <= 9.0)]),
    "legacy_tip_r_outer_4_9": np.ptp(leg_ro[(YS >= 4.0) & (YS <= 9.0)]),
    "approved_root_r_min_4_9": np.ptp(app_rmin[(YS >= 4.0) & (YS <= 9.0)]),
    "legacy_root_r_min_4_9": np.ptp(leg_rmin[(YS >= 4.0) & (YS <= 9.0)]),
}
E_CONSTANCY = float(max(_spans.values()))
E_CAD = 0.002 + E_CONSTANCY
facts["cad_constancy_spans_mm"] = {k: float(v) for k, v in _spans.items()}
log("e_cad = 0.002 decode + %.5f measured constancy" % E_CONSTANCY)


def rect_clearance(ro, ys, rho0, ya, yb, exclude=None):
    """Min meridian distance from rectangle [rho0, inf) x [ya, yb] to region rho <= r(y)."""
    assert exclude is None or not exclude.all(), "rect_clearance: every station excluded (vacuous pair)"
    dy = np.maximum(0.0, np.maximum(ya - ys, ys - yb))
    drho = rho0 - ro
    inside = (dy == 0) & (drho <= 0)
    d = np.where(inside, drho, np.hypot(np.maximum(drho, 0.0), dy))
    if exclude is not None:
        d = np.where(exclude, np.inf, d)
    i = int(np.argmin(d))
    return float(d[i]), float(ys[i])


# ------------------------------------------------------------------ shaper
# Generating band: tooth material. Groove edge (root level down to root-0.1): tangential skim, contact pair.
gen_band = (YS >= FACE_START - 0.05) & (YS <= teeth_end)
edge_band = (YS > teeth_end) & (YS < edge_end)
assert gen_band.any() and edge_band.any(), "empty shaper generation/edge band"
overtravel = 0.5
lead_end = teeth_end + overtravel
yc_end = lead_end - SHAPER_T / 2
yc_start = pilot_end - 0.4 - SHAPER_T / 2
shaper_pairs = {}


def shaper_record(key, d, y, e, pose, contact=False):
    rec = shaper_pairs.get(key)
    if rec is None or d < rec["min_distance_mm"]:
        shaper_pairs[key] = {"min_distance_mm": d, "at_y_mm": y, "e_total_mm": e, "pose": pose, "contact_pair": contact}


e_sh = E_CAD + E_PROFILE
e_sh_path = e_sh + 0.005  # 0.01 mm stroke step
for phase, ys_c, rho0 in (("cut", np.arange(yc_start, yc_end + 1e-9, 0.01), rho_cut),
                          ("return", np.arange(yc_start, yc_end + 1e-9, 0.01), rho_cut + SHAPER_BACKOFF)):
    for yc in ys_c:
        ya, yb = yc - SHAPER_T / 2, yc + SHAPER_T / 2
        d, y = rect_clearance(leg_rd, YS, rho0, ya, yb, exclude=(gen_band | edge_band) if phase == "cut" else None)
        shaper_record("shaper_cutter_%s_vs_legacy_nongenerating" % phase, d, y, e_sh_path, {"phase": phase, "yc": round(float(yc), 3)})
        if phase == "cut":
            d, y = rect_clearance(leg_rd, YS, rho0, ya, yb, exclude=~edge_band)
            shaper_record("shaper_cutter_cut_vs_groove_lip_root_boundary", d, y, e_sh_path, {"phase": phase, "yc": round(float(yc), 3)})
        trail = ya
        for name, (rad, length) in HOLDERS.items():
            off = {"hub": 0.0, "clamp_nut": 0.0, "arbor": 6.0}[name]
            hb, ha = trail - off, trail - off - length
            d, y = rect_clearance(leg_rd, YS, SHAPER_C + (rho0 - rho_cut) - rad, ha, hb)
            shaper_record("shaper_%s_%s_vs_legacy" % (name, phase), d, y, e_sh_path, {"phase": phase, "yc": round(float(yc), 3)})
for frac in np.linspace(0, 1, 51):  # backoff at stroke end, infeed at stroke start
    for key, yc in (("backoff", yc_end), ("infeed", yc_start)):
        rho0 = rho_cut + SHAPER_BACKOFF * frac
        d, y = rect_clearance(leg_rd, YS, rho0, yc - SHAPER_T / 2, yc + SHAPER_T / 2, exclude=gen_band | edge_band)
        shaper_record("shaper_cutter_%s_vs_legacy" % key, d, y, e_sh_path, {"phase": key, "rho_near": round(float(rho0), 4)})
# The cutting (leading) face must pass the last tooth material; the body trails in the cut tooth space.
exit_margin = float(lead_end - teeth_end)
wall_margin = float(groove_end - lead_end)

# ------------------------------------------------------------------ hob
ramp = (YS >= FACE_END) & (YS <= RAMP_END) & np.isfinite(app_rmin)
ry, rf = YS[ramp], app_rmin[ramp]


def hob_points(R, yc, A, g, ds, db, s_lo=-HOB_LEN / 2, s_hi=HOB_LEN / 2, band=1.25):
    s = np.arange(s_lo, s_hi + 1e-12, ds)
    b = np.arange(math.pi - band, math.pi + band + 1e-12, db)
    S, B = np.meshgrid(s, b, indexing="ij")
    S, B = S.ravel(), B.ravel()
    cg, sg = math.cos(g), math.sin(g)
    x = S * cg + R * np.sin(B) * sg
    y = yc + S * sg - R * np.sin(B) * cg
    z = A + R * np.cos(B)
    return np.hypot(x, z), y


def envelope(R, yc, A, g, ds=0.04, db=math.radians(0.25)):
    rho, y = hob_points(R, yc, A, g, ds, db)
    idx = np.round((y - Y_LO) / H).astype(int)
    env = np.full(len(YS), np.inf)
    np.minimum.at(env, np.clip(idx, 0, len(YS) - 1), rho)
    return env


best = None
for R in np.arange(5.80, 6.401, 0.01):
    g = math.asin(HOB_M / (2 * (R - (5.0 - ROOT_R))))  # normal module: sin(lead) = m_n / d_pitch
    A = ROOT_R + R
    for ye in np.arange(FACE_END - 0.10, FACE_END + 0.101, 0.01):
        env = envelope(R, ye, A, g, ds=0.08, db=math.radians(0.5))
        dev = env[ramp] - rf
        score = float(np.abs(dev[np.isfinite(dev)]).max())
        if best is None or score < best[0]:
            best = (score, float(R), float(ye), g)
_, R_HOB, YC_END, G_HOB = best
A_HOB = ROOT_R + R_HOB
env = envelope(R_HOB, YC_END, A_HOB, G_HOB, ds=0.02, db=math.radians(0.1))
dev = env[ramp] - rf
ramp_fit = {"R_mm": round(R_HOB, 4), "stop_yc_mm": round(YC_END, 4), "lead_angle_deg": round(math.degrees(G_HOB), 4),
            "max_abs_dev_mm": float(np.abs(dev).max()), "rms_dev_mm": float(np.sqrt(np.mean(dev ** 2))),
            "max_overcut_mm": float(max(0.0, -dev.min())), "max_undercut_mm": float(max(0.0, dev.max())),
            "stations": int(ramp.sum())}
log("hob ramp fit " + json.dumps(ramp_fit))

DS, DB = 0.02, math.radians(0.1)
E_SAMPLE = 0.5 * math.hypot(DS, R_HOB * DB)
e_hob = E_CAD + E_PROFILE + E_SAMPLE
blank_rd = app_rd.copy()
blank_rd[(YS >= FACE_START) & (YS <= RAMP_END)] = np.maximum(blank_rd[(YS >= FACE_START) & (YS <= RAMP_END)], TIP_R)


def meridian_clearance(rho, y, prof, keep, reach=0.8):
    """Min distance from points to region rho <= prof(y') over stations where keep is true."""
    assert keep.any(), "meridian_clearance: empty keep mask (vacuous pair)"
    # Prefilter: a point farther than reach (radially, against the window max) cannot be the minimum
    # unless every point is; keep the closest-by-bound points only.
    k = int(reach / H)
    masked = np.where(keep, prof, 0.0)
    win = masked.copy()
    for off in range(1, k + 1):
        win = np.maximum(win, np.maximum(np.roll(masked, off), np.roll(masked, -off)))
    jj = np.clip(np.round((y - Y_LO) / H).astype(int), 0, len(YS) - 1)
    bound = rho - win[jj]
    near = bound < reach
    if not near.any():
        i = int(np.argmin(bound))
        return float(bound[i]), float(YS[jj[i]]), float(rho[i]), float(y[i])
    rho, y = rho[near], y[near]
    j0 = np.round((y - Y_LO) / H).astype(int)
    best_d = np.full(len(rho), np.inf)
    best_j = np.zeros(len(rho), dtype=int)
    for off in range(-k, k + 1):
        j = np.clip(j0 + off, 0, len(YS) - 1)
        dy = np.abs(y - YS[j])
        drho = rho - prof[j]
        inside = (dy <= H / 2) & (drho <= 0)
        d = np.where(inside, drho, np.hypot(np.maximum(drho, 0.0), dy))
        d = np.where(keep[j], d, np.inf)
        better = d < best_d
        best_d = np.where(better, d, best_d)
        best_j = np.where(better, j, best_j)
    i = int(np.argmin(best_d))
    return float(best_d[i]), float(YS[best_j[i]]), float(rho[i]), float(y[i])


# Zones from geometry: generated band while tooth spaces exist; turned stock above the filler OD
# (legacy has the same cone 2.75 mm earlier, so it is turned, not hob-generated); the junction
# between ramp end and the start of turned stock is uncut filler OD where the envelope exits.
# Threshold 0.03 mm = about 3x the measured vertex-to-chord sag of turned features (ro - rmin ~ 0.010).
_spaces = (app_ro - np.nan_to_num(app_rmin, nan=0.0) > 0.03) & (YS >= FACE_START) & (YS < JOURNAL_Y)
RAMP_END_MEASURED = float(YS[_spaces].max())
FILLER_R = float(at(app_ro, RAMP_END_MEASURED + 0.02))
_after = (YS > RAMP_END_MEASURED) & (YS < JOURNAL_Y)
_turned = _after & (app_ro > FILLER_R + 0.01)
zones = {
    "journal_side_y_ge_14_18": YS >= JOURNAL_Y,
    "turned_cone_above_filler_od": _turned,
    "ramp_end_junction_filler_od": _after & ~_turned,
    "free_end_y_lt_face": YS < FACE_START - 0.05,
}
facts["hob_zones"] = {"ramp_end_measured_y": RAMP_END_MEASURED, "filler_od_r": FILLER_R,
                      "turned_cone_y": [float(YS[_turned].min()), float(YS[_turned].max())] if _turned.any() else None}
for _zn, _zm in zones.items():
    assert _zm.any(), "empty clearance zone: " + _zn
assert RAMP_END - 0.1 <= RAMP_END_MEASURED <= RAMP_END + 0.1, "measured ramp end %.3f far from 13.78" % RAMP_END_MEASURED
CONTACT_LOCATION_LIMIT = RAMP_END_MEASURED + 0.1
# Junction band holds vanishing tooth spaces: the hob generates floor there, so it is compared with the
# approved floor r_min (equals the section minimum where no space remains). r_min samples chord midpoints,
# so the measured chord sag of turned features is added to that pair's error budget.
E_CHORD = float(np.max((app_ro - app_rmin)[(YS >= 15.6) & (YS <= 19.2)]))
app_floor = np.where(np.isfinite(app_rmin), app_rmin, app_ro)
facts["hob_zones"]["chord_sag_mm"] = E_CHORD
hob_pairs = {}


def hob_record(key, val, e, pose, contact=False):
    d, ys_, rho_p, y_p = val
    rec = hob_pairs.get(key)
    if rec is None or d < rec["min_distance_mm"]:
        hob_pairs[key] = {"min_distance_mm": d, "at_shaft_y_mm": ys_, "tool_point_rho_y_mm": [rho_p, y_p],
                          "e_total_mm": e, "pose": pose, "contact_pair": contact}


def holder_points(yc, A):
    pts = []
    cr = R_HOB + 1.0
    for sgn in (-1, 1):
        rho, y = hob_points(cr, yc, A, G_HOB, 0.05, math.radians(0.25), s_lo=sgn * HOB_LEN / 2 if sgn > 0 else -HOB_LEN / 2 - COLLAR_W,
                            s_hi=HOB_LEN / 2 + COLLAR_W if sgn > 0 else -HOB_LEN / 2, band=1.6)
        pts.append((rho, y))
        rho, y = hob_points(R_HOB - 1.5, yc, A, G_HOB, 0.05, math.radians(0.25),
                            s_lo=HOB_LEN / 2 + COLLAR_W if sgn > 0 else -HOB_LEN / 2 - COLLAR_W - ARBOR_L,
                            s_hi=HOB_LEN / 2 + COLLAR_W + ARBOR_L if sgn > 0 else -HOB_LEN / 2 - COLLAR_W, band=1.6)
        pts.append((rho, y))
    return np.concatenate([p[0] for p in pts]), np.concatenate([p[1] for p in pts])


# Final pose (exact sampling) against approved geometry.
rho, y = hob_points(R_HOB, YC_END, A_HOB, G_HOB, DS, DB, band=1.6)
for zname, keep in zones.items():
    if zname == "free_end_y_lt_face":
        continue
    junction = zname == "ramp_end_junction_filler_od"
    hob_record("hob_final_vs_approved_" + zname + ("_floor" if junction else ""),
               meridian_clearance(rho, y, app_floor if junction else app_rd, keep), e_hob + (E_CHORD if junction else 0.0),
               {"phase": "final", "yc": YC_END, "A": A_HOB}, contact=junction)
hrho, hy = holder_points(YC_END, A_HOB)
hob_record("hob_collars_arbor_final_vs_approved_all", meridian_clearance(hrho, hy, app_rd, np.ones(len(YS), bool), reach=1.0),
           e_hob, {"phase": "final"})
# Path poses (coarser sampling + path step) against the revised smooth blank / approved journal side.
y_in = FACE_START - R_HOB - 1.5
e_path = E_CAD + E_PROFILE + 0.5 * math.hypot(0.05, R_HOB * math.radians(0.3)) + 0.025
poses = [("infeed", y_in, A_HOB + HOB_RETRACT * (1 - f)) for f in np.linspace(0, 1, 26)]
poses += [("feed_journal_side", yc, A_HOB) for yc in np.arange(YC_END - 1.5, YC_END + 1e-9, 0.05)]
poses += [("retract", YC_END, A_HOB + HOB_RETRACT * f) for f in np.linspace(0, 1, 51)]
poses += [("withdraw", yc, A_HOB + HOB_RETRACT) for yc in np.arange(YC_END, y_in - 1e-9, -0.1)]
for phase, yc, A in poses:
    rho, y = hob_points(R_HOB, yc, A, G_HOB, 0.05, math.radians(0.3), band=1.6)
    keep_j = zones["journal_side_y_ge_14_18"] | zones["turned_cone_above_filler_od"]
    hob_record("hob_path_vs_approved_journal_side", meridian_clearance(rho, y, app_rd, keep_j), e_path, {"phase": phase, "yc": round(float(yc), 3), "A": round(float(A), 4)})
    if phase in ("infeed", "retract", "withdraw"):
        # Retract starts seated in the tooth spaces it just generated; radial withdrawal from a
        # conjugate mesh only opens backlash, so the cut band is excluded for retract (journal
        # side and free end must still clear). Infeed/withdraw are checked against the whole blank.
        keep_b = np.ones(len(YS), bool) if phase != "retract" else ~((YS >= FACE_START - 0.05) & (YS < JOURNAL_Y))
        hob_record("hob_%s_vs_blank_all" % phase, meridian_clearance(rho, y, blank_rd, keep_b), e_path, {"phase": phase, "yc": round(float(yc), 3), "A": round(float(A), 4)})
        if phase == "retract":
            hob_record("hob_retract_vs_approved_ramp_end_junction_floor_contact", meridian_clearance(rho, y, app_floor, zones["ramp_end_junction_filler_od"]),
                       e_path + E_CHORD, {"phase": phase, "yc": round(float(yc), 3), "A": round(float(A), 4)}, contact=True)
    hrho, hy = holder_points(yc, A)
    hob_record("hob_collars_arbor_path_vs_blank", meridian_clearance(hrho, hy, blank_rd, np.ones(len(YS), bool), reach=1.0), e_path, {"phase": phase, "yc": round(float(yc), 3)})

# ------------------------------------------------------------------ verdicts
pairs = []
for src in (shaper_pairs, hob_pairs):
    for key, rec in src.items():
        d, e = rec["min_distance_mm"], rec["e_total_mm"]
        if rec["contact_pair"]:
            loc = rec.get("at_shaft_y_mm", rec.get("at_y_mm"))
            ok = d >= -e and (d >= 0 or loc <= CONTACT_LOCATION_LIMIT)
            crit = "generation exit contact: penetration <= e_total and located within 0.1 mm of measured ramp end (%.3f)" % RAMP_END_MEASURED
        elif key.endswith("_root_boundary"):
            ok = d - e >= 0
            crit = "generated root boundary (cutter runs at root + 5 um stock): no interference, d - e_total >= 0"
        else:
            ok = d - e >= MARGIN
            crit = "d - e_total >= %.3f" % MARGIN
        pairs.append({"pair": key, **rec, "d_minus_e_total_mm": d - e, "criterion": crit, "PASS": bool(ok)})
pairs.append({"pair": "shaper_cutting_face_past_last_tooth_material", "min_distance_mm": exit_margin, "e_total_mm": e_sh,
              "d_minus_e_total_mm": exit_margin - e_sh, "criterion": "leading face beyond last tooth material by >= margin",
              "PASS": bool(exit_margin - e_sh >= MARGIN)})
pairs.append({"pair": "shaper_cutting_face_axial_room_to_groove_wall", "min_distance_mm": wall_margin, "e_total_mm": e_sh,
              "d_minus_e_total_mm": wall_margin - e_sh, "criterion": "axial room to groove wall >= margin (radial wall clearance is in the nongenerating pair)",
              "PASS": bool(wall_margin - e_sh >= MARGIN)})
ramp_ok = ramp_fit["max_abs_dev_mm"] <= 0.05
pairs.append({"pair": "hob_reproduces_approved_ramp_floor", "min_distance_mm": -ramp_fit["max_overcut_mm"],
              "e_total_mm": e_hob, "criterion": "max |envelope - approved floor| <= 0.05 mm (lite fidelity)",
              "PASS": bool(ramp_ok), **ramp_fit})
verdict = "CERTIFIED" if all(p["PASS"] for p in pairs) else "UNRESOLVED"
if sha256(BLEND) != BLEND_SHA:
    raise SystemExit("HASH_MISMATCH_AFTER")
report = {
    "schema": "jgun-g0-clearance/v4-meridian", "generated_utc": datetime.now(timezone.utc).isoformat(),
    "command": COMMAND, "source": {"blend": str(BLEND), "sha256_before_after": BLEND_SHA},
    "method": __doc__.strip(), "facts": facts,
    "shaper": {"shaft": "SHAFT_P001835_ORIG (legacy grooved blank)", "teeth": N_SHAPER, "centre_distance_mm": SHAPER_C,
               "signed_ratio_work_over_cutter": -N_SHAPER / 10, "tip_radius_mm": SHAPER_RT, "thickness_mm": SHAPER_T,
               "stroke_centre_y_mm": [round(yc_start, 4), round(yc_end, 4)], "overtravel_past_last_stub_mm": overtravel,
               "return_backoff_mm": SHAPER_BACKOFF, "holders_radius_length_mm": HOLDERS,
               "note": "Generating fit (conjugate profile) from camera/profile-study: MATCHED_SHAPER N=20 C=15.5. Backoff exaggerated for legibility; illustrative."},
    "hob": {"shaft": "revised smooth blank, approved journal side", "starts": 1, "module_mm": HOB_M, **ramp_fit,
            "centre_distance_mm": A_HOB, "length_mm": HOB_LEN, "collar_radius_mm": R_HOB + 1.0, "arbor_radius_mm": R_HOB - 1.5,
            "path": "infeed radial at yc=%.3f; feed +Y at full depth to yc=%.4f; retract %.1f mm radial; withdraw -Y" % (y_in, YC_END, HOB_RETRACT)},
    "error_budget_mm": {"e_cad": E_CAD, "e_profile": E_PROFILE, "e_hob_sampling": E_SAMPLE, "e_hob_final": e_hob,
                        "e_hob_path": e_path, "e_shaper": e_sh, "e_shaper_path": e_sh_path, "margin": MARGIN},
    "pairs": pairs, "verdict": verdict,
}
(OUT / "report.json").write_text(json.dumps(report, indent=1, default=float), encoding="utf-8")
np.savez_compressed(OUT / "profiles.npz", y=YS, legacy_r_outer=leg_ro, legacy_r_min=leg_rmin, approved_r_outer=app_ro, approved_r_min=app_rmin)
for p in pairs:
    log("%-52s d=%9.5f e=%7.5f %s" % (p["pair"], p["min_distance_mm"], p["e_total_mm"], "PASS" if p["PASS"] else "FAIL"))
print("G0_CLEARANCE_V4 %s pairs=%d fail=%d" % (verdict, len(pairs), sum(not p["PASS"] for p in pairs)), flush=True)

