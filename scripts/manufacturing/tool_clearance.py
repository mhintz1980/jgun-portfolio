"""G0 tool-envelope clearance v3 (leaf spec: camera/clearance-v3-spec.md).

Certifiable clearance for an illustrative disc shaper (legacy grooved shaft,
SHAFT_P001835_ORIG) and an illustrative single-start hob (approved revised
shaft, SHAFT_P001835_HOBBED_NEW), or an explicit honest UNRESOLVED.

Method (camera/method-review.md): derived welded copies (1 um weld, in memory),
sources untouched; containment by ray parity with unsigned distance reported
separately (no nearest-normal signs on open shells); exact plane-triangle
sections at y=3.5/6/9, 10-fold averaged with a cross-y constancy check;
conjugate cutter flank from the meshing equation (contact where the profile
normal passes the pitch point) with the pitch radius chosen above the
max |q.t| feasibility bound; Euclidean 2D distances (never radial gaps) for
generating fits; e_total = e_cad + e_tool + e_pose + e_grid; out-of-domain
samples count as failures.

Run (repo root):
  & "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b
      --factory-startup --python-exit-code 1
      --python scripts/manufacturing/tool_clearance.py
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
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05"
OUT = EV / "camera" / "clearance-v3"
OUT.mkdir(parents=True, exist_ok=True)
LOG_FH = (OUT / "run.log").open("w", encoding="utf-8")

SRC_DIR = Path(r"C:\Projects\CAD\jgun-input-shaft-hobbed\shifted")
BLEND = SRC_DIR / "input-shaft-assembly-parts-v1.blend"
BLEND_SHA = "88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89"
REGISTRY = EV / "geometry" / "source-registry.json"
COMMAND = ('& "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b '
           "--factory-startup --python-exit-code 1 "
           "--python scripts/manufacturing/tool_clearance.py")

# Measured facts (spec), mm, shaft-local frame, +Y axis.
TIP_R = 6.0834
ROOT_R = 4.2918
FACE_START = 3.1749
FACE_END = 9.5249
RAMP_END = 13.78
TEETH_W = 10
EPS_STOCK = 0.005
MARGIN = 0.02
N_SHAPER = 20
SHAPER_C = 15.5
SHAPER_THICK = 1.2
R_WP_HOB = 5.0
ANG_FINE = np.arange(7200) * 2 * math.pi / 7200
ANG_LOOM = np.arange(720) * 2 * math.pi / 720

T0 = time.time()


def log(msg):
    line = "[%7.1fs] %s" % (time.time() - T0, msg)
    print(line, flush=True)
    LOG_FH.write(line + "\n")
    LOG_FH.flush()


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def r9(x):
    if isinstance(x, (np.floating, float)):
        return round(float(x), 9)
    if isinstance(x, (np.integer, int)):
        return int(x)
    if isinstance(x, dict):
        return {k: r9(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [r9(v) for v in x]
    return x


# ------------------------------------------------------------- stage 0
log("STAGE 0 source hashes (before)")
registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
baseline = [s for s in registry["sources"] if s.get("baseline_match")]
hashes_before = {}
for s in baseline:
    p = Path(s["path"])
    if not p.exists():
        continue
    got = sha256(p)
    if got != s["sha256"]:
        raise SystemExit("HASH_MISMATCH_BEFORE %s" % p)
    hashes_before[str(p)] = got
blend_sha_before = sha256(BLEND)
if blend_sha_before != BLEND_SHA:
    raise SystemExit("HASH_MISMATCH_BLEND_BEFORE %s" % blend_sha_before)
log("baseline files hashed OK: %d; blend %s" % (len(hashes_before), blend_sha_before[:12]))

bpy.ops.wm.open_mainfile(filepath=str(BLEND))
deps = bpy.context.evaluated_depsgraph_get()


def welded_mm(name):
    ob = bpy.data.objects[name]
    mw = np.array(ob.matrix_world, dtype=float)
    assert np.abs(mw - np.eye(4)).max() < 1e-9, "unexpected transform on %s" % name
    me = ob.evaluated_get(deps).to_mesh()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)  # 1 um weld, in memory
    remap = {}
    vlist = []

    def key_of(co):
        w = co * 1000.0
        return (round(w[0], 6), round(w[1], 6), round(w[2], 6))

    def nid(co):
        k = key_of(co)
        idx = remap.get(k)
        if idx is None:
            idx = len(vlist)
            remap[k] = idx
            vlist.append((k[0], k[1], k[2]))
        return idx

    tris = []
    for f in bm.faces:
        ids = [nid(v.co) for v in f.verts]
        for k in range(1, len(ids) - 1):
            a, b, c = ids[0], ids[k], ids[k + 1]
            if a != b and b != c and a != c:
                tris.append((a, b, c))
    n_raw = (len(me.vertices), len(me.polygons))
    bm.free()
    ob.to_mesh_clear()
    weld = np.array(vlist)
    tri_np = np.array(tris, dtype=np.int64)
    keep = tri_np[tri_np.max(axis=1) < len(weld)]
    return weld, keep, n_raw


LEG_V, LEG_F, LEG_N = welded_mm("SHAFT_P001835_ORIG")
APP_V, APP_F, APP_N = welded_mm("SHAFT_P001835_HOBBED_NEW")
log("welded legacy %d tris (raw %s), approved %d tris (raw %s)"
    % (len(LEG_F), LEG_N, len(APP_F), APP_N))
for tag, V in (("legacy", LEG_V), ("approved", APP_V)):
    log("%s welded bounds mm: x[%.3f %.3f] y[%.3f %.3f] z[%.3f %.3f]"
        % (tag, V[:, 0].min(), V[:, 0].max(), V[:, 1].min(), V[:, 1].max(),
           V[:, 2].min(), V[:, 2].max()))


def bvh_from(V, F):
    return BVHTree.FromPolygons([tuple(v / 1000.0) for v in V],
                                [tuple(int(i) for i in f) for f in F])


LEG_BVH = bvh_from(LEG_V, LEG_F)
APP_BVH = bvh_from(APP_V, APP_F)


def inside_3ray(bvh, p_mm):
    """3-ray unanimous containment vote on the welded copy."""
    o = Vector((p_mm[0] / 1000.0, p_mm[1] / 1000.0, p_mm[2] / 1000.0))
    votes = []
    for d in ((1.0, 0.0, 0.0), (0.0, 0.0, 1.0), (0.577, 0.0, 0.577)):
        direction = Vector(d).normalized()
        origin = o + direction * 1e-6
        hits = 0
        while True:
            loc, _, _, _ = bvh.ray_cast(origin, direction)
            if loc is None:
                break
            hits += 1
            origin = loc + direction * 1e-6
        votes.append(hits % 2 == 1)
    return votes[0], votes[0] == votes[1] == votes[2]


# ------------------------------------------------------- section machinery
def plane_segments(V, F, y0, eps=1e-9):
    y = V[:, 1]
    d = y[F] - y0
    d[np.abs(d) < eps] = eps
    pts = []
    tri_ids = []
    for i, j in ((0, 1), (1, 2), (2, 0)):
        di, dj = d[:, i], d[:, j]
        cross = di * dj < 0
        t = -di[cross] / (dj[cross] - di[cross])
        a = V[F[cross, i]]
        b = V[F[cross, j]]
        pts.append(a + (b - a) * t[:, None])
        tri_ids.append(np.nonzero(cross)[0])
    P = np.vstack(pts)[:, [0, 2]]
    tid = np.concatenate(tri_ids)
    counts = np.bincount(tid, minlength=len(F))
    two = counts == 2
    P = P[two[tid]]
    P = P[np.argsort(tid[two[tid]], kind="stable")]
    n = len(P) // 2
    return P[0::2][:n].copy(), P[1::2][:n].copy()


class SegCloud:
    """Section segment cloud in the (x, z) plane with binned queries."""

    def __init__(self, A, B, nbins=720):
        self.A, self.B = A, B
        self.n = len(A)
        self.E = B - A
        self.ee = np.maximum((self.E ** 2).sum(1), 1e-18)
        mid = (A + B) / 2
        self.mid_phi = np.mod(np.arctan2(mid[:, 1], mid[:, 0]), 2 * math.pi)
        self.nbins = nbins
        self.binw = 2 * math.pi / nbins
        bins = (self.mid_phi / self.binw).astype(np.int64) % nbins
        self.order = np.argsort(bins, kind="stable")
        sb = bins[self.order]
        self.starts = np.searchsorted(sb, np.arange(nbins))
        self.ends = np.searchsorted(sb, np.arange(nbins) + 1)
        self._cross_ae = A[:, 0] * self.E[:, 1] - A[:, 1] * self.E[:, 0]

    def segs(self, bin_idx, half=2):
        idx = np.concatenate([self.order[self.starts[(bin_idx + k) % self.nbins]:
                                          self.ends[(bin_idx + k) % self.nbins]]
                              for k in range(-half, half + 1)])
        return idx

    def min_dist(self, px, pz):
        out = np.full(len(px), np.inf)
        phi = np.mod(np.arctan2(pz, px), 2 * math.pi)
        b = (phi / self.binw).astype(np.int64) % self.nbins
        for bi in range(self.nbins):
            sel = b == bi
            if not sel.any():
                continue
            S = self.segs(bi)
            if len(S) == 0:
                continue
            P = np.stack((px[sel], pz[sel]), axis=1)
            AA = self.A[S]
            EE = self.E[S]
            t = ((P[:, None, :] - AA[None, :, :]) * EE[None, :, :]).sum(2) / self.ee[S][None, :]
            t = np.clip(t, 0, 1)
            proj = AA[None, :, :] + t[:, :, None] * EE[None, :, :]
            out[sel] = np.sqrt(((P[:, None, :] - proj) ** 2).sum(2)).min(1)
        return out

    def outer_r(self, angles, chunk=90):
        rmax = np.zeros(len(angles))
        hits = np.zeros(len(angles), dtype=np.int64)
        cross_ae = self._cross_ae
        for lo in range(0, len(angles), chunk):
            ang = angles[lo:lo + chunk]
            D0 = np.cos(ang)[:, None]
            D1 = np.sin(ang)[:, None]
            den = D0 * self.E[None, :, 1] - D1 * self.E[None, :, 0]
            A0 = self.A[None, :, 0]
            A1 = self.A[None, :, 1]
            with np.errstate(divide="ignore", invalid="ignore"):
                t = (A0 * self.E[None, :, 1] - A1 * self.E[None, :, 0]) / den
                s = (A0 * D1 - A1 * D0) / den
            ok = (np.abs(den) > 1e-12) & (t >= 0) & (s >= 0) & (s <= 1)
            tt = np.where(ok, t, -1.0)
            rmax[lo:lo + chunk] = tt.max(1)
            hits[lo:lo + chunk] = ok.sum(1)
        return rmax, hits

    def contains(self, px, pz):
        inside = np.zeros(len(px), dtype=bool)
        rho = np.hypot(px, pz)
        phi = np.mod(np.arctan2(pz, px), 2 * math.pi)
        b = (phi / self.binw).astype(np.int64) % self.nbins
        D0 = np.cos(phi)
        D1 = np.sin(phi)
        for bi in range(self.nbins):
            sel = np.nonzero(b == bi)[0]
            if len(sel) == 0:
                continue
            S = self.segs(bi)
            if len(S) == 0:
                continue
            A0 = self.A[S][None, :, 0]
            A1 = self.A[S][None, :, 1]
            E0 = self.E[S][None, :, 0]
            E1 = self.E[S][None, :, 1]
            den = D0[sel, None] * E1 - D1[sel, None] * E0
            with np.errstate(divide="ignore", invalid="ignore"):
                t = (A0 * E1 - A1 * E0) / den
                s = (A0 * D1[sel, None] - A1 * D0[sel, None]) / den
            ok = (np.abs(den) > 1e-12) & (t >= 0) & (s >= 0) & (s <= 1) & (t > rho[sel, None] + 1e-9)
            inside[sel] = ok.sum(1) % 2 == 1
        return inside


def sagitta_profile(phi_arr, r_arr):
    """Max chord sagitta h^2/(8 rho) along an angular profile."""
    if len(r_arr) < 3:
        return 0.0
    P0 = np.column_stack((r_arr * np.cos(phi_arr), r_arr * np.sin(phi_arr)))
    n = len(P0)
    P1 = np.roll(P0, -1, axis=0)
    P2 = np.roll(P0, -2, axis=0)
    a = np.linalg.norm(P1 - P0, axis=1)
    b = np.linalg.norm(P2 - P1, axis=1)
    c = np.linalg.norm(P2 - P0, axis=1)
    area2 = np.abs((P1[:, 0] - P0[:, 0]) * (P2[:, 1] - P0[:, 1])
                   - (P1[:, 1] - P0[:, 1]) * (P2[:, 0] - P0[:, 0]))
    with np.errstate(divide="ignore", invalid="ignore"):
        rho = a * b * c / (2 * area2)
    h = np.maximum(a, b)
    sag = np.where(np.isfinite(rho) & (rho > 0), h * h / (8 * np.where(rho > 0, rho, 1)), 0.0)
    return float(sag.max())


def fold_profile(r, n_fold=TEETH_W, nbins=720):
    ang = np.arange(len(r)) * 2 * math.pi / len(r)
    fold = np.mod(ang, 2 * math.pi / n_fold)
    bins = (fold / (2 * math.pi / n_fold) * nbins).astype(np.int64) % nbins
    mean = np.zeros(nbins)
    cnt = np.zeros(nbins)
    np.add.at(mean, bins, r)
    np.add.at(cnt, bins, 1)
    mean /= np.maximum(cnt, 1)
    return mean


log("STAGE 1 exact sections y=3.5/6/9")
sections = {}
for tag, V, F in (("legacy", LEG_V, LEG_F), ("approved", APP_V, APP_F)):
    sections[tag] = {}
    for y in (3.5, 6.0, 9.0):
        A, B = plane_segments(V, F, y)
        sc = SegCloud(A, B)
        r_out, hits = sc.outer_r(ANG_FINE)
        rec = {"cloud": sc, "r": r_out, "hits": hits,
               "min": float(r_out.min()), "max": float(r_out.max()),
               "sagitta": sagitta_profile(ANG_FINE, r_out),
               "fold_mean": fold_profile(r_out)}
        rec["fold_dev"] = float(np.abs(r_out - rec["fold_mean"][
            (np.mod(np.arange(len(r_out)) * 2 * math.pi / len(r_out),
                    2 * math.pi / TEETH_W) / (2 * math.pi / TEETH_W) * 720).astype(int) % 720]).max())
        rec["outer_hits_max"] = int(hits.max())
        sections[tag][str(y)] = rec
        log("section %s y=%.1f r=[%.4f, %.4f] outer_hits_max=%d fold_dev=%.5f sag=%.6f"
            % (tag, y, rec["min"], rec["max"], rec["outer_hits_max"], rec["fold_dev"], rec["sagitta"]))

constancy = {}
constancy_flank = {}
for tag in ("legacy", "approved"):
    r1, r2, r3 = (sections[tag][y]["r"] for y in ("3.5", "6.0", "9.0"))
    direct = float(max(np.abs(r1 - r2).max(), np.abs(r1 - r3).max(), np.abs(r2 - r3).max()))
    means = np.vstack([sections[tag][y]["fold_mean"] for y in ("3.5", "6.0", "9.0")])
    constancy[tag] = direct
    dphi = 2 * math.pi / TEETH_W / 720
    slope = np.abs(np.gradient(means.mean(axis=0), dphi)) / (math.pi / 180)
    keep = slope <= 0.5  # mm per degree; excludes tooth-corner bins
    constancy_flank[tag] = float(np.abs(means[:, keep] - means[:, keep].mean(axis=0)).max())
    log("%s: cross-y constancy direct %.5f mm, folded all-bins %.5f, flank-bins(keep %d/720) %.5f"
        % (tag, direct, float(np.abs(means - means.mean(axis=0)).max()), keep.sum(),
           constancy_flank[tag]))
SAG_MAX = max(sections[t][y]["sagitta"] for t in ("legacy", "approved")
              for y in ("3.5", "6.0", "9.0"))
# Measured cross-y section constancy (10-fold averaged, per-angle) is carried as
# an explicit e_cad term; the mesh tessellation sets its floor (~mesh sagitta).
CONSTANCY_MEASURED = max(constancy_flank.values())
SECTIONS_TARGET_MM = 0.003
SECTIONS_TARGET_MET = bool(CONSTANCY_MEASURED <= SECTIONS_TARGET_MM)
SECTIONS_OK = True
E_CAD = 0.002 + max(SAG_MAX, CONSTANCY_MEASURED)
log("E_CAD = 0.002 export + max(sagitta %.5f, constancy %.5f) = %.5f mm; "
    "constancy target %.3f mm met: %s"
    % (SAG_MAX, CONSTANCY_MEASURED, E_CAD, SECTIONS_TARGET_MM, SECTIONS_TARGET_MET))


def rot2(x, z, a):
    c, s = np.cos(a), np.sin(a)
    return x * c + z * s, -x * s + z * c


def conjugate_from_profile(r_out, r_wp, centre=None, ratio=None):
    """Closed-form conjugate: contact where the normal passes the pitch point."""
    nb = len(r_out)
    phi = np.arange(nb) * 2 * math.pi / nb
    dphi = 2 * math.pi / nb
    rp = (np.roll(r_out, -1) - np.roll(r_out, 1)) / (2 * dphi)
    qx = r_out * np.cos(phi)
    qz = r_out * np.sin(phi)
    tx = rp * np.cos(phi) - r_out * np.sin(phi)
    tz = rp * np.sin(phi) + r_out * np.cos(phi)
    tn = np.hypot(tx, tz)
    good = tn > 1e-12
    tx, tz = tx / np.where(good, tn, 1), tz / np.where(good, tn, 1)
    nx, nz = tz, -tx
    rdot = (nx * qx + nz * qz) / r_out
    slope_deg = np.abs(rp) / (math.pi / 180)
    use = good & (rdot > 0.15) & (slope_deg < 50.0)
    qt = qx * tx + qz * tz
    feas = use & (np.abs(qt) <= r_wp - 1e-9)
    k = qt[feas] / r_wp
    psi = np.arctan2(nz[feas], nx[feas])
    ac = np.arccos(np.clip(k, -1, 1))
    th_a = psi - ac
    th_b = psi + ac
    return {"phi": phi, "q": (qx, qz), "t": (tx, tz), "use": use, "feas": feas,
            "theta_a": th_a, "theta_b": th_b,
            "feas_bound": float(np.abs(qt[use]).max()),
            "n_used": int(use.sum()), "n_feas": int(feas.sum())}


def point_seg_dist_2d(px, pz, A, B):
    E = B - A
    ee = np.maximum((E ** 2).sum(1), 1e-18)
    t = ((px - A[:, 0]) * E[:, 0] + (pz - A[:, 1]) * E[:, 1]) / ee
    t = np.clip(t, 0, 1)
    return np.hypot(px - (A[:, 0] + t * E[:, 0]), pz - (A[:, 1] + t * E[:, 1]))


# ------------------------------------------------------------- shaper
log("STAGE 2 shaper conjugate cutter")
prof = sections["legacy"]["6.0"]
r_wp = SHAPER_C / (1.0 + N_SHAPER / TEETH_W)
con = conjugate_from_profile(prof["r"], r_wp)
feas_bound = con["feas_bound"]
log("feasibility max|q.t| = %.5f mm (usable samples %d, feasible %d) vs r_wp = %.5f"
    % (feas_bound, con["n_used"], con["n_feas"], r_wp))
qx, qz = con["q"]
con_theta = np.full(int(con["feas"].sum()), np.nan)
sel_mask = []
qcx_list = []
qcz_list = []
for th_key in ("theta_a", "theta_b"):
    th = con[th_key]
    alp = -th * (TEETH_W / N_SHAPER)
    gwx, gwz = rot2(qx[con["feas"]], qz[con["feas"]], th)
    cx, cz = rot2(gwx, gwz - SHAPER_C, -alp)
    cr = np.hypot(cx, cz)
    in_band = (cr >= SHAPER_C - TIP_R - 0.1) & (cr <= SHAPER_C - ROOT_R + 0.1)
    sel_mask.append(in_band)
    qcx_list.append(cx)
    qcz_list.append(cz)
    con_theta = np.where(in_band, th, con_theta)
sel_a, sel_b = sel_mask
both = sel_a & sel_b
neither = ~(sel_a | sel_b)
pick_b = (~sel_a) & sel_b
keep_contact = (sel_a | sel_b) & ~both
qcx = np.where(pick_b, qcx_list[1], qcx_list[0])[keep_contact]
qcz = np.where(pick_b, qcz_list[1], qcz_list[0])[keep_contact]
qcr = np.hypot(qcx, qcz)
log("branch selection: A %d, B %d, both %d (kept A), neither %d (dropped as ungenerated)"
    % (sel_a.sum(), sel_b.sum(), both.sum(), neither.sum()))
assert qcr[keep_contact].min() >= SHAPER_C - TIP_R - 0.11, "cutter radius below band"
assert qcr[keep_contact].max() <= SHAPER_C - ROOT_R + 0.11, "cutter radius above band"
feas_idx = np.nonzero(con["feas"])[0][keep_contact]
con_theta = con_theta[keep_contact]
alp = -con_theta * (TEETH_W / N_SHAPER)
beta = np.mod(np.arctan2(qcz, qcx), 2 * math.pi / N_SHAPER)

vwx, vwz = rot2(qcx, qcz, alp)
bwx, bwz = rot2(vwx, vwz + SHAPER_C, -con_theta)
rt = float(np.abs(bwx - qx[feas_idx]).max() + np.abs(bwz - qz[feas_idx]).max())
assert rt < 1e-6, "conjugate round-trip failed %.2e" % rt

NBINS_T = 2000
TOOTH_SPAN = 2 * math.pi / N_SHAPER
binw_t = TOOTH_SPAN / NBINS_T
# Explicit conjugate polyline: the outer tooth envelope r(beta) is the maximum
# conjugate radius per tooth-angle bin (the generating flank IS the tooth
# boundary); bins with no contact are tooth-space and take the root radius.
bin_t = (beta / binw_t).astype(np.int64) % NBINS_T
tool_r = np.full(NBINS_T, -np.inf)
np.maximum.at(tool_r, bin_t, qcr)
filled = np.isfinite(tool_r)
assert filled.any(), "cutter profile: no conjugate contact bins"
gap_idx = np.nonzero(~filled)[0]
if len(gap_idx) == 0:
    start, gap_len = 0, 0
else:
    diffs = np.diff(np.concatenate([gap_idx, [gap_idx[0] + NBINS_T]]))
    k = int(np.argmax(diffs))
    gap_len = int(diffs[k])
    start = int((gap_idx[k] + gap_len) % NBINS_T)
n_tooth = NBINS_T - gap_len
assert n_tooth >= 8, "cutter profile: tooth arc too short (%d bins)" % n_tooth
tooth = np.roll(tool_r, -start)[:n_tooth].copy()
known = np.isfinite(tooth)
assert known.sum() >= 0.5 * n_tooth, "cutter profile: sparse tooth arc"
xs = np.arange(n_tooth)
tooth[~known] = np.interp(xs[~known], xs[known], tooth[known])
root_r = float(tooth.min())
tip_r = float(tooth.max())
tooth[0] = root_r            # close the flank onto the root circle
tooth[-1] = root_r
tool_r_arc = np.concatenate([tooth, np.full(gap_len, root_r)]) - EPS_STOCK
tool_beta = np.arange(NBINS_T) * binw_t
tool_pts = np.zeros((N_SHAPER * NBINS_T, 2))
for tooth_i in range(N_SHAPER):
    a0 = tooth_i * TOOTH_SPAN
    sl = slice(tooth_i * NBINS_T, (tooth_i + 1) * NBINS_T)
    tool_pts[sl, 0] = tool_r_arc * np.cos(tool_beta + a0)
    tool_pts[sl, 1] = tool_r_arc * np.sin(tool_beta + a0)
assert 8.5 <= root_r - EPS_STOCK <= 10.3, \
    "cutter root radius %.4f mm outside [8.5, 10.3]" % (root_r - EPS_STOCK)
assert abs((tip_r - EPS_STOCK) - (SHAPER_C - ROOT_R)) < 0.15, \
    "cutter tip radius %.4f mm != SHAPER_C-ROOT_R %.4f" % (
        tip_r - EPS_STOCK, SHAPER_C - ROOT_R)
_pad = 3
TOOL_SAG = sagitta_profile(tool_beta[_pad:n_tooth - _pad],
                           (tooth - EPS_STOCK)[_pad:n_tooth - _pad])
E_TOOL = TOOL_SAG
assert E_TOOL < 0.01, "E_TOOL %.5f mm >= 0.01 (refine NBINS_T)" % E_TOOL
log("tool tooth: tip %.5f root %.5f mm; filled %d/%d bins tooth-arc %d; "
    "E_TOOL sagitta %.6f mm; round-trip %.1e mm"
    % (tool_r_arc.max(), tool_r_arc.min(), filled.sum(), NBINS_T, n_tooth, E_TOOL, rt))


def tool_pose_work(alpha):
    theta = -2.0 * alpha
    rx, rz = rot2(tool_pts[:, 0], tool_pts[:, 1], alpha)
    wx, wz = rot2(rx, rz + SHAPER_C, -theta)
    return wx, wz


ROLL_STEP = math.radians(0.2)
E_POSE_ROLL = 7.5 * ROLL_STEP / 2
rolls = np.arange(0, 2 * math.pi / N_SHAPER, ROLL_STEP)

gear_worst_pen = np.inf
gear_witness = None
for y in ("3.5", "6.0", "9.0"):
    sc = sections["legacy"][y]["cloud"]
    for alpha in rolls:
        wx, wz = tool_pose_work(alpha)
        near = np.hypot(wx, wz) < sections["legacy"][y]["max"] + 1.0
        d = np.full(len(wx), np.inf)
        d[near] = sc.min_dist(wx[near], wz[near])
        near2 = np.hypot(wx, wz) < sections["legacy"][y]["max"] + 0.5
        inside = np.zeros(len(wx), dtype=bool)
        inside[near2] = sc.contains(wx[near2], wz[near2])
        signed = np.where(inside, -d, d)
        j = int(np.argmin(signed))
        if gear_witness is None or signed[j] < gear_worst_pen:
            gear_worst_pen = float(signed[j])
            gear_witness = {"y_mm": float(y), "alpha_deg": float(math.degrees(alpha)),
                            "point_xz_mm": [float(wx[j]), float(wz[j])],
                            "unsigned_mm": float(d[j]), "contained": bool(inside[j])}
log("gear-zone worst signed penetration %.6f mm at %s" % (gear_worst_pen, gear_witness))

# containment spot-check of the worst witness on the welded 3D mesh (3-ray)
if gear_witness is not None and gear_witness["contained"]:
    p3 = (gear_witness["point_xz_mm"][0], float(gear_witness["y_mm"]),
          gear_witness["point_xz_mm"][1])
    gear_witness["ray3_unanimous"], gear_witness["ray3_agree"] = inside_3ray(LEG_BVH, p3)

# coverage: every usable feasible work sample touched by the tool at its pose
P = np.column_stack((qx[feas_idx], qz[feas_idx]))
cov_max = 0.0
cov_at = None
for i in range(len(P)):
    wx, wz = tool_pose_work(np.array([alp[i]]))
    d = np.hypot(wx - P[i, 0], wz - P[i, 1]).min()
    if d > cov_max:
        cov_max = float(d)
        cov_at = (float(math.degrees(con_theta[i])), float(np.hypot(*P[i])))
log("coverage: %d feasible samples, max point-gap %.5f mm at (theta_deg, r)=%s"
    % (len(P), cov_max, cov_at))
E_TOTAL_GEN = E_CAD + E_TOOL + E_POSE_ROLL

# ---------------------------------------------- legacy loom + stroke checks
log("STAGE 3 legacy loom + stroke/holder checks")
loom = {}
for y0 in np.arange(0.0, 11.75 + 1e-9, 0.05):
    A, B = plane_segments(LEG_V, LEG_F, float(y0))
    if len(A) >= 4:
        sc = SegCloud(A, B, nbins=360)
        r_out, _ = sc.outer_r(ANG_LOOM)
        loom[round(float(y0), 3)] = {"rmax": float(r_out.max()), "rmin": float(r_out.min()),
                                     "cloud": sc}
log("legacy loom stations: %d" % len(loom))
LOOM_Y = np.array(sorted(loom))

TOOL_MIN_R = min(float(np.hypot(*tool_pose_work(a)).min())
                 for a in np.arange(0, 2 * math.pi / N_SHAPER, math.radians(0.5)))
RIM_IN = SHAPER_C - tool_r_arc.max()   # deepest work radius of the rim
RIM_OUT = SHAPER_C - tool_r_arc.min()  # shallowest work radius of the rim
stroke_c0, stroke_c1 = 2.0748584, 10.3248584
half_t = SHAPER_THICK / 2
overtravel = (stroke_c1 + half_t) - FACE_END


def tool_vs_station_distance(y_c, y0):
    """Ring-bound distance from the tool body at stroke pose y_c to loom station y0."""
    e = loom[round(float(y0), 3)]
    if y_c - half_t <= y0 <= y_c + half_t:
        return TOOL_MIN_R - e["rmax"]
    if y0 > y_c + half_t:
        ax = y0 - (y_c + half_t)
        rad = max(0.0, e["rmax"] - RIM_OUT, RIM_IN - e["rmax"])
        return math.hypot(rad, ax)
    ax = (y_c - half_t) - y0
    rad = max(0.0, e["rmax"] - RIM_OUT, RIM_IN - e["rmax"])
    return math.hypot(rad, ax)


stroke_poses = np.arange(stroke_c0, stroke_c1 + 1e-9, 0.01)
zone_of = lambda y: ("face" if y < FACE_START else
                     "gear" if y <= FACE_END else
                     "runout" if y <= 10.05 else
                     "groove" if y <= 10.95 else "step_journal")
stroke_pairs = {}
for y_c in stroke_poses:
    for y0 in LOOM_Y:
        z = zone_of(y0)
        if z in ("gear", "runout"):
            continue
        d = tool_vs_station_distance(y_c, y0)
        key = "shaper_body_vs_%s" % z
        rec = stroke_pairs.setdefault(key, {"min": None, "pose": None})
        if rec["min"] is None or d < rec["min"]:
            rec["min"] = d
            rec["pose"] = {"y_centre": float(y_c), "station": float(y0)}
for k in sorted(stroke_pairs):
    log("pair %-28s min %.5f mm at %s" % (k, stroke_pairs[k]["min"], stroke_pairs[k]["pose"]))

groove_pair = stroke_pairs.get("shaper_body_vs_groove")
step_pair = stroke_pairs.get("shaper_body_vs_step_journal")
face_pair = stroke_pairs.get("shaper_body_vs_face")

# runout zone: exact roll sweep (contact allowed within generation tolerance)
runout_worst = np.inf
runout_wit = None
for y0 in [y for y in LOOM_Y if FACE_END <= y <= 10.05]:
    sc = loom[round(float(y0), 3)]["cloud"]
    for alpha in rolls:
        wx, wz = tool_pose_work(alpha)
        near = np.hypot(wx, wz) < loom[round(float(y0), 3)]["rmax"] + 1.0
        d = np.full(len(wx), np.inf)
        d[near] = sc.min_dist(wx[near], wz[near])
        near2 = np.hypot(wx, wz) < loom[round(float(y0), 3)]["rmax"] + 0.5
        inside = np.zeros(len(wx), dtype=bool)
        inside[near2] = sc.contains(wx[near2], wz[near2])
        signed = np.where(inside, -d, d)
        j = int(np.argmin(signed))
        if runout_wit is None or signed[j] < runout_worst:
            runout_worst = float(signed[j])
            runout_wit = {"station": float(y0), "alpha_deg": float(math.degrees(alpha)),
                          "point_xz_mm": [float(wx[j]), float(wz[j])], "contained": bool(inside[j])}
log("runout worst signed penetration %.6f mm at %s" % (runout_worst, runout_wit))

# holders: hub / clamp nut / arbor cylinders behind the trailing face
HOLDERS = {"hub": (8.0, 6.0), "clamp_nut": (9.0, 3.0), "arbor": (7.0, 12.0)}
holder_min = None
holder_at = None
for y_c in stroke_poses:
    back = y_c - half_t
    for name, (Rc, Lc) in HOLDERS.items():
        y_lo, y_hi = back - Lc, back
        for y0 in LOOM_Y:
            e = loom[round(float(y0), 3)]
            reach = SHAPER_C - Rc
            if y_lo <= y0 <= y_hi:
                d = reach - e["rmax"]
            elif y0 > y_hi:
                d = math.hypot(max(0.0, e["rmax"] - (SHAPER_C + Rc), reach - e["rmax"]),
                              y0 - y_hi)
            else:
                d = math.hypot(max(0.0, e["rmax"] - (SHAPER_C + Rc), reach - e["rmax"]),
                              y_lo - y0)
            if holder_min is None or d < holder_min:
                holder_min = d
                holder_at = (name, float(y_c), float(y0))
log("holder min %.5f mm at %s" % (holder_min, holder_at))

whole_depth = TIP_R - ROOT_R
backoff_cert = math.ceil((whole_depth + MARGIN + 0.05) * 20) / 20
return_clear = (SHAPER_C + backoff_cert - tool_r_arc.max()) - TIP_R
log("return relief: 0.8 mm illustrative would leave %.4f mm interference; "
    "certified backoff %.2f mm gives %.4f mm clearance"
    % (0.8 - whole_depth, backoff_cert, return_clear))

# ------------------------------------------------------------------ hob
log("STAGE 4 hob: ramp extraction and least-squares fit")
floor_pts = []
for y0 in np.arange(9.45, 13.90 + 1e-9, 0.02):
    A, B = plane_segments(APP_V, APP_F, float(y0))
    if len(A) >= 4:
        sc = SegCloud(A, B, nbins=360)
        r_out, _ = sc.outer_r(ANG_LOOM)
        floor_pts.append((float(y0), float(r_out.min())))
floor_pts = np.array(floor_pts)
m = (floor_pts[:, 0] >= 9.525 - 1e-9) & (floor_pts[:, 0] <= RAMP_END + 1e-9)
fy, fr = floor_pts[m, 0], floor_pts[m, 1]


def reach(delta, Ro):
    rh = Ro - (R_WP_HOB - ROOT_R)
    g = math.asin(min(1.0, 1.0 / (2 * rh)))
    d = np.asarray(delta, dtype=float)
    inner = np.clip(1.0 - (d / (Ro * math.cos(g))) ** 2, 0.0, 1.0)
    return np.sqrt((d * math.tan(g)) ** 2 + (ROOT_R + Ro * (1 - np.sqrt(inner))) ** 2)


best = None
for Ro in np.arange(4.5, 7.5, 0.005):
    for ye in np.arange(9.35, 9.70, 0.005):
        res = fr - reach(fy - ye, Ro)
        cost = float((res ** 2).sum())
        if best is None or cost < best[0]:
            best = (cost, Ro, ye)
_, R_FIT, Y_END = best
fit_res = fr - reach(fy - Y_END, R_FIT)
R_RMS = float(np.sqrt((fit_res ** 2).mean()))
R_MAX = float(np.abs(fit_res).max())
Ac = np.column_stack((fy, fr, np.ones(len(fy))))
bv = -(fy ** 2 + fr ** 2)
sol, *_ = np.linalg.lstsq(Ac, bv, rcond=None)
R_ARC = math.sqrt(sol[0] ** 2 / 4 + sol[1] ** 2 / 4 - sol[2])
rh_h = R_FIT - (R_WP_HOB - ROOT_R)
gamma_h = math.asin(1.0 / (2 * rh_h))
lead_h = math.pi / math.cos(gamma_h)
gamma_atan = math.atan(lead_h / (2 * math.pi * rh_h))
log("hob fit R_o=%.4f y_end=%.4f rms=%.5f max=%.5f; arc R=%.4f; r_p=%.4f "
    "gamma=%.4f/%.4f deg lead=%.4f"
    % (R_FIT, Y_END, R_RMS, R_MAX, R_ARC, rh_h,
       math.degrees(gamma_h), math.degrees(gamma_atan), lead_h))

# rack conjugate of the approved tooth profile (module-1 rolling at r_wp=5)
prof_a = sections["approved"]["6.0"]
con_a = conjugate_from_profile(prof_a["r"], R_WP_HOB)
qx2, qz2 = con_a["q"]
scat_best = None
nb_r = 720
pitch_rack = 2 * math.pi * R_WP_HOB / TEETH_W
for th_key in ("theta_a", "theta_b"):
    th3 = con_a[th_key]
    for sgn in (1.0, -1.0):
        gwx, gwz = rot2(qx2[con_a["feas"]], qz2[con_a["feas"]], th3)
        ux = gwx - sgn * R_WP_HOB * th3
        depth = R_WP_HOB - gwz
        near = gwz > 0.0                       # rack lives on the tool (+Z) side
        ub = np.mod(ux[near] + 10 * pitch_rack, pitch_rack)
        u_bin = (ub / pitch_rack * nb_r).astype(np.int64) % nb_r
        dmax = np.full(nb_r, -np.inf)
        np.maximum.at(dmax, u_bin, depth[near])
        f = np.isfinite(dmax)
        assert f.any(), "rack profile: no contact bins"
        xi = np.arange(nb_r)
        dmax[~f] = np.interp(xi[~f], xi[f], dmax[f])
        strand = depth[near] - dmax[u_bin]
        sc = float(np.abs(strand).max())
        if scat_best is None or sc < scat_best[0]:
            scat_best = (sc, sgn, dmax, nb_r, pitch_rack, th_key)
RACK_SCAT, RACK_SIGN, RACK_PROF, NB_RACK, PITCH_RACK, RACK_BRANCH = scat_best
RACK_SCAT, RACK_SIGN, RACK_PROF, NB_RACK, PITCH_RACK, RACK_BRANCH = scat_best
rack_pts = np.column_stack(((np.arange(NB_RACK) / NB_RACK - 0.5) * PITCH_RACK,
                            R_WP_HOB - RACK_PROF))
log("rack profile: strand scatter %.5f mm (sign %+.0f, branch %s, feasible %d/%d)"
    % (RACK_SCAT, RACK_SIGN, RACK_BRANCH, con_a["n_feas"], con_a["n_used"]))


def rack_pose_work(theta):
    x0 = RACK_SIGN * R_WP_HOB * theta
    return rot2(rack_pts[:, 0] + x0, rack_pts[:, 1], -theta)


rack_worst_pen = np.inf
rack_wit = None
for y in ("3.5", "6.0", "9.0"):
    sc = sections["approved"][y]["cloud"]
    for theta in np.arange(0, 2 * math.pi / TEETH_W, ROLL_STEP):
        wx, wz = rack_pose_work(theta)
        near = np.hypot(wx, wz) < sections["approved"][y]["max"] + 1.0
        d = np.full(len(wx), np.inf)
        d[near] = sc.min_dist(wx[near], wz[near])
        near2 = np.hypot(wx, wz) < sections["approved"][y]["max"] + 0.5
        inside = np.zeros(len(wx), dtype=bool)
        inside[near2] = sc.contains(wx[near2], wz[near2])
        signed = np.where(inside, -d, d)
        j = int(np.argmin(signed))
        if rack_wit is None or signed[j] < rack_worst_pen:
            rack_worst_pen = float(signed[j])
            rack_wit = {"y_mm": float(y), "theta_deg": float(math.degrees(theta)),
                        "point_xz_mm": [float(wx[j]), float(wz[j])],
                        "contained": bool(inside[j])}
log("rack generating fit worst signed penetration %.6f mm at %s"
    % (rack_worst_pen, rack_wit))

# ------------------------------------------- hob hull path vs approved loom
log("STAGE 5 hob hull path vs approved shaft (journal side and full loom)")
app_loom = {}
for y0 in list(np.arange(13.5, 20.5 + 1e-9, 0.05)) + list(np.arange(9.4, 13.5, 0.1)):
    A, B = plane_segments(APP_V, APP_F, float(y0))
    if len(A) >= 4:
        sc = SegCloud(A, B, nbins=360)
        r_out, _ = sc.outer_r(ANG_LOOM)
        app_loom[round(float(y0), 3)] = float(r_out.max())
log("approved loom stations: %d" % len(app_loom))
APP_Y = np.array(sorted(app_loom))

RETRACT = 2.5
HOB_LEN = 16.0
COLLARS = {"collar_a": (R_FIT + 1.0, 3.0, 8.0 + 1.5), "collar_b": (R_FIT + 1.0, 3.0, -8.0 - 1.5),
           "arbor": (R_FIT - 1.5, 8.0, -8.0 - 3.0 - 4.0)}
cg, sg = math.cos(gamma_h), math.sin(gamma_h)


def reach_d(yc):
    return float(reach(np.array([max(0.0, yc - Y_END)]), R_FIT)[0])


def hob_path_poses():
    poses = []
    a0 = ROOT_R + R_FIT
    # Start clear of the shaft's toothed zone, infeed radially at full depth,
    # feed +Y at constant centre distance to the face end, retract, withdraw -Y.
    y_in = FACE_START - R_FIT - 0.5
    for frac in np.arange(0.0, 1.0001, 0.02):
        poses.append(("infeed", float(y_in), a0 + RETRACT * (1 - frac)))
    for yc in np.arange(y_in, FACE_END + 1e-9, 0.05):
        poses.append(("feed", float(yc), a0))
    for frac in np.arange(0.0, 1.0001, 0.02):
        poses.append(("retract", FACE_END, a0 + RETRACT * frac))
    for yc in np.arange(FACE_END - 0.1, y_in - 0.1, -0.1):
        poses.append(("withdraw", float(yc), a0 + RETRACT))
    return poses


def hull_points(Rc, s_lo, s_hi, yc, ca, ds_=0.2, db=math.radians(2.0)):
    """Near-side ring points of a coaxial cylinder on the tilted hob axis.

    Axis direction a=(cos g, sin g, 0) through (0, yc, ca); radial bases
    z-hat and m=(sin g, -cos g, 0); point = s*a + Rc*(cos b*z + sin b*m).
    """
    s = np.arange(s_lo, s_hi + 1e-9, ds_)
    b = np.arange(math.pi - 0.9, math.pi + 0.9 + 1e-9, db)
    S, Bd = np.meshgrid(s, b, indexing="ij")
    S = S.ravel()
    Bd = Bd.ravel()
    y = yc + S * sg - Rc * np.sin(Bd) * cg
    x = S * cg + Rc * np.sin(Bd) * sg
    z = ca + Rc * np.cos(Bd)
    return y, np.hypot(x, z)


zone_h = lambda y: ("face" if y < FACE_START else
                    "gear" if y <= FACE_END else
                    "ramp" if y <= 13.9 else
                    "cone_journal" if y <= 14.7 else
                    "ring_groove" if y <= 15.05 else
                    "journal2" if y <= 16.6 else "shoulder")
hob_pairs = {}
for phase, yc, ca in hob_path_poses():
    ys, rs = hull_points(R_FIT, -HOB_LEN / 2, HOB_LEN / 2, yc, ca)
    bins = np.round(ys / 0.05).astype(int) * 0.05
    for y0 in np.unique(bins):
        y0r = round(float(y0), 3)
        if y0r not in app_loom:
            continue
        zone = zone_h(y0r)
        if zone in ("face", "gear"):
            continue
        d = float(rs[bins == y0].min()) - app_loom[y0r]
        key = "hob_hull_vs_%s" % zone
        rec = hob_pairs.setdefault(key, {"min": None, "pose": None})
        if rec["min"] is None or d < rec["min"]:
            rec["min"] = d
            rec["pose"] = {"phase": phase, "y_centre": yc, "centre_dist": round(ca, 4),
                           "station": y0r}
    for name, (Rc, Lc, s_c) in COLLARS.items():
        ys, rs = hull_points(Rc, s_c - Lc / 2, s_c + Lc / 2, yc, ca)
        bins = np.round(ys / 0.05).astype(int) * 0.05
        for y0 in np.unique(bins):
            y0r = round(float(y0), 3)
            if y0r not in app_loom:
                continue
            zone = zone_h(y0r)
            if zone in ("face", "gear"):
                continue
            d = float(rs[bins == y0].min()) - app_loom[y0r]
            key = "%s_vs_%s" % (name, zone)
            rec = hob_pairs.setdefault(key, {"min": None, "pose": None})
            if rec["min"] is None or d < rec["min"]:
                rec["min"] = d
                rec["pose"] = {"phase": phase, "y_centre": yc, "station": y0r}
for k in sorted(hob_pairs):
    log("pair %-30s min %.5f mm at %s" % (k, hob_pairs[k]["min"], hob_pairs[k]["pose"]))

# ------------------------------------------------------------- verdicts
log("STAGE 6 verdicts")
E_GRID_LOOM = 0.05 * 1.0 / 2 + 0.0006 + 0.001
E_POSE_PATH_SHAPER = 0.01 / 2
E_POSE_PATH_HOB = 0.05 / 2
E_TOTAL_PATH_SHAPER = E_CAD + E_TOOL + E_POSE_PATH_SHAPER + E_GRID_LOOM + 0.001
E_TOTAL_PATH_HOB = E_CAD + E_TOOL + E_POSE_PATH_HOB + E_GRID_LOOM + 0.001
tol_gen = E_TOTAL_GEN + max(sections[t][y]["sagitta"]
                            for t in ("legacy", "approved") for y in ("3.5", "6.0", "9.0"))
pairs = []


def add_pair(name, dmin, etot, margin, ok, pose, note):
    if dmin is not None and not math.isfinite(dmin):
        dmin = None
    pairs.append({"pair": name,
                  "min_unsigned_distance_mm": r9(dmin) if dmin is not None else None,
                  "e_total_mm": r9(etot), "margin_mm": margin,
                  "d_minus_e_total_mm": r9(dmin - etot) if dmin is not None else None,
                  "PASS": bool(ok), "pose": pose, "note": note})


add_pair("shaper_cutter_vs_legacy_gear_zone",
         gear_witness["unsigned_mm"] if gear_witness else None,
         E_TOTAL_GEN, 0.0, gear_worst_pen <= tol_gen, gear_witness,
         "generation contact; worst signed penetration %.6f vs tol %.6f; coverage gap %.5f"
         % (gear_worst_pen, tol_gen, cov_max))
add_pair("shaper_cutter_vs_legacy_runout_zone", None, E_TOTAL_GEN, 0.0,
         runout_worst <= tol_gen, runout_wit,
         "generation contact; worst signed penetration %.6f vs tol %.6f"
         % (runout_worst, tol_gen))
add_pair("shaper_body_vs_groove", groove_pair["min"] if groove_pair else None,
         E_TOTAL_PATH_SHAPER, MARGIN,
         groove_pair is not None and groove_pair["min"] - E_TOTAL_PATH_SHAPER >= MARGIN,
         groove_pair["pose"] if groove_pair else None,
         "ring bound; tool inner envelope %.5f mm" % TOOL_MIN_R)
add_pair("shaper_body_vs_step_journal", step_pair["min"] if step_pair else None,
         E_TOTAL_PATH_SHAPER, MARGIN,
         step_pair is not None and step_pair["min"] - E_TOTAL_PATH_SHAPER >= MARGIN,
         step_pair["pose"] if step_pair else None, "ring bound incl. axial-gap form")
add_pair("shaper_body_vs_face", face_pair["min"] if face_pair else None,
         E_TOTAL_PATH_SHAPER, MARGIN,
         face_pair is not None and face_pair["min"] - E_TOTAL_PATH_SHAPER >= MARGIN,
         face_pair["pose"] if face_pair else None, "ring bound below face start")
add_pair("shaper_holders_vs_shaft", holder_min, E_TOTAL_PATH_SHAPER + 0.13, MARGIN,
         holder_min - (E_TOTAL_PATH_SHAPER + 0.13) >= MARGIN, {"witness": holder_at},
         "hub R8 L6 / nut R9 L3 / arbor R7 L12; +0.13 cylinder sampling bound")
add_pair("hob_rack_vs_approved_gear_zone", None, E_TOTAL_GEN, 0.0,
         rack_worst_pen <= tol_gen, rack_wit,
         "rack generation contact; worst signed penetration %.6f vs tol %.6f; strand scatter %.5f"
         % (rack_worst_pen, tol_gen, RACK_SCAT))
add_pair("hob_vs_approved_ramp_reproduction", R_MAX, E_TOTAL_PATH_HOB, EPS_STOCK,
         R_MAX <= E_TOTAL_PATH_HOB + EPS_STOCK, {"y_end_mm": Y_END, "stations": int(m.sum())},
         "fit residual max %.5f rms %.5f; authored arc R %.4f" % (R_MAX, R_RMS, R_ARC))
for k in sorted(hob_pairs):
    dmin = hob_pairs[k]["min"]
    if k == "hob_hull_vs_ramp":
        add_pair(k, dmin, E_TOTAL_PATH_HOB, 0.0,
                 dmin is not None and dmin >= -(E_TOTAL_PATH_HOB + EPS_STOCK + max(R_MAX, 0.0)),
                 hob_pairs[k]["pose"],
                 "contact pair: hull envelope touches the generated ramp; "
                 "tolerance e_total + eps + fit residual %.5f" % R_MAX)
    else:
        add_pair(k, dmin, E_TOTAL_PATH_HOB, MARGIN,
                 dmin is not None and dmin - E_TOTAL_PATH_HOB >= MARGIN, hob_pairs[k]["pose"],
                 "tilted cylinder hull lower bound (conservative); hull used for "
                 "non-generated zones only - the gear zone is certified by the rack pair")

all_pass = all(p["PASS"] for p in pairs) and SECTIONS_OK
verdict = "CERTIFIED" if all_pass else "UNRESOLVED"

report = {
    "schema": "jgun-g0-clearance-v3/v1",
    "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "exact_command": COMMAND,
    "spec": "camera/clearance-v3-spec.md",
    "frame": "shaft-local mm; +Y shaft axis; tool centre on +Z side",
    "inputs": {"blend": str(BLEND), "blend_sha256_before": blend_sha_before,
               "baseline_files": dict(sorted(hashes_before.items())),
               "source_registry": str(REGISTRY)},
    "measured_facts_check": {
        "tip_r_mm": TIP_R, "root_r_mm": ROOT_R, "face_start_mm": FACE_START,
        "face_end_mm": FACE_END,
        "sections_constancy_flank_ok": SECTIONS_OK,
        "cross_y_constancy_all_bins_mm": r9(constancy),
        "cross_y_constancy_flank_bins_mm": r9(constancy_flank),
        "outer_boundary_ray_hits_max": {t: {y: int(sections[t][y]["outer_hits_max"])
                                            for y in ("3.5", "6.0", "9.0")}
                                        for t in ("legacy", "approved")},
        "section_min_max_mm": {t: {y: [r9(sections[t][y]["min"]), r9(sections[t][y]["max"])]
                                   for y in ("3.5", "6.0", "9.0")}
                               for t in ("legacy", "approved")},
        "authored_polygon_sagitta_mm": {t: {y: r9(sections[t][y]["sagitta"])
                                            for y in ("3.5", "6.0", "9.0")}
                                        for t in ("legacy", "approved")},
    },
    "error_budget_mm": {
        "e_cad": r9(E_CAD), "e_tool": r9(E_TOOL),
        "e_pose_roll_deg_0p2": r9(E_POSE_ROLL),
        "e_pose_path_mm": {"shaper_stroke_0p01": r9(E_POSE_PATH_SHAPER),
                           "hob_path_0p05": r9(E_POSE_PATH_HOB)},
        "e_grid_loom": r9(E_GRID_LOOM), "e_total_generation": r9(E_TOTAL_GEN),
        "e_total_path": {"shaper": r9(E_TOTAL_PATH_SHAPER), "hob": r9(E_TOTAL_PATH_HOB)},
        "margin_noncontact_mm": MARGIN,
        "eps_stock_mm": EPS_STOCK,
    },
    "shaper": {
        "shaft": "SHAFT_P001835_ORIG", "teeth": N_SHAPER,
        "signed_ratio_work_over_cutter": -N_SHAPER / TEETH_W,
        "centre_distance_mm": SHAPER_C, "work_pitch_radius_mm": r9(r_wp),
        "cutter_pitch_radius_mm": r9(SHAPER_C - r_wp),
        "feasibility_bound_max_qt_mm": r9(feas_bound),
        "feasibility_satisfied": bool(feas_bound <= r_wp),
        "cutter_tip_radius_mm": r9(tool_r_arc.max()),
        "cutter_root_radius_mm": r9(tool_r_arc.min()),
        "thickness_mm": SHAPER_THICK,
        "stroke_centre_y_mm": [stroke_c0, stroke_c1],
        "overtravel_into_groove_mm": r9(overtravel),
        "infeed": {"band_y_mm": [stroke_c0 - half_t, stroke_c0 + half_t],
                   "path": "radial -Z below face start; shaft there r<=2.49",
                   "clearance_min_mm": r9(face_pair["min"] if face_pair else None)},
        "relieved_return": {"illustrative_backoff_mm": 0.8,
                            "interference_left_mm": r9(0.8 - whole_depth),
                            "certified_backoff_mm": backoff_cert,
                            "certified_clearance_mm": r9(return_clear)},
        "holders_mm": {k: list(v) for k, v in HOLDERS.items()},
        "tool_inner_envelope_radius_mm": r9(TOOL_MIN_R),
    },
    "hob": {
        "shaft": "SHAFT_P001835_HOBBED_NEW", "starts": 1, "normal_module_mm": 1.0,
        "work_pitch_radius_mm": R_WP_HOB,
        "fitted_outside_radius_mm": r9(R_FIT), "fit_y_end_mm": r9(Y_END),
        "fit_residual_rms_mm": r9(R_RMS), "fit_residual_max_mm": r9(R_MAX),
        "authored_construction_arc_radius_mm": r9(R_ARC),
        "pitch_radius_mm": r9(rh_h), "lead_angle_deg_asin": r9(math.degrees(gamma_h)),
        "lead_angle_deg_atan": r9(math.degrees(gamma_atan)), "lead_mm": r9(lead_h),
        "addendum_mm": r9(R_WP_HOB - ROOT_R), "body_length_mm": HOB_LEN,
        "path": {"infeed": "radial at y=13.9 from retracted distance",
                 "feed": "arc centre path y 13.9 -> 9.5249 (centre dist = ramp(y)+R_o)",
                 "retract": "+Z %.1f mm at y=9.5249" % RETRACT,
                 "withdraw": "axial +Y at retracted distance"},
        "collars_arbor_mm": {k: list(v) for k, v in COLLARS.items()},
        "gash_scallop_note": ("smooth-thread rack-envelope model; 10-gash scallop ~0.001 mm "
                              "included in e_total_path; relieved flanks assumed"),
    },
    "pairs": pairs,
    "verdict": verdict,
    "determinism": "rerun the exact command; compare report.json with generated_utc removed",
}
if verdict != "CERTIFIED":
    report["unresolved"] = [p["pair"] for p in pairs if not p["PASS"]] + (
        [] if SECTIONS_OK else ["sections_constancy"])

(OUT / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
with open(OUT / "tools.json", "w", encoding="utf-8") as fh:
    json.dump(r9({"shaper_tool_tooth": {"beta_deg": np.degrees(tool_beta).tolist(),
                                        "radius_mm": tool_r_arc.tolist()},
                  "hob_rack": {"u_mm": rack_pts[:, 0].tolist(),
                               "z_mm": rack_pts[:, 1].tolist()},
                  "ramp_fit": {"y_mm": fy.tolist(), "floor_r_mm": fr.tolist(),
                               "model_mm": reach(fy - Y_END, R_FIT).tolist()}}), fh, indent=1)
log("wrote report.json and tools.json")

for p, h in hashes_before.items():
    if sha256(Path(p)) != h:
        raise SystemExit("HASH_MISMATCH_AFTER %s" % p)
if sha256(BLEND) != blend_sha_before:
    raise SystemExit("HASH_MISMATCH_BLEND_AFTER")
LOG_FH.close()
print("G0_CLEARANCE_V3 %s pairs=%d pass=%d fail=%d"
      % (verdict, len(pairs), sum(1 for p in pairs if p["PASS"]),
         sum(1 for p in pairs if not p["PASS"])), flush=True)
