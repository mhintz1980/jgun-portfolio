"""Modal launcher for armament clip renders (Blender 5.2.x, CPU).

DRY RUN by default: prints the request and a cost estimate, makes no cloud call.
  python launch.py --glb <model.glb> --out <run_dir> --angles 0:360:2 --pass both --engine workbench
Spend only with --execute and a --max-usd cap; the estimate must be under the cap.

Run it from a normal terminal. Modal's gRPC does not work through the HTTPS_PROXY that some
sandboxed shells set; if it hangs on "Could not connect", run with the proxy vars unset:
  env -u HTTPS_PROXY -u https_proxy python launch.py ...
Never print or log ~/.modal.toml.
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
import time
from pathlib import Path

BLENDER_VERSION = "5.2.2"
SERIES = ".".join(BLENDER_VERSION.split(".")[:2])
BLENDER_ARCHIVE = f"blender-{BLENDER_VERSION}-linux-x64.tar.xz"
BLENDER_BASE = f"https://download.blender.org/release/Blender{SERIES}"
SCRIPT = Path(__file__).resolve().parent.parent / "blender" / "render_clip.py"
# Rates from msp-render-pipeline-scene-prep/scripts/cloud_job_render.py (unverified against current Modal pricing)
CPU_RATE = 0.0000131  # $/core-second
MEM_RATE = 0.00000222  # $/GiB-second


def parse_angles(spec):
    a, b, s = (float(x) for x in spec.split(":"))
    out, v = [], a
    while v < b - 1e-9:
        out.append(round(v, 4))
        v += s
    return out


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def chunks(seq, n):
    k = math.ceil(len(seq) / n)
    return [seq[i:i + k] for i in range(0, len(seq), k)]


def render_shard(cfg):
    """Runs inside the Modal container."""
    import glob
    import os
    import subprocess as sp
    import time as t

    t0 = t.monotonic()
    out = "/tmp/out"
    os.makedirs(out, exist_ok=True)
    cmd = ["/opt/blender/blender", "-b", "--factory-startup", "--python-exit-code", "3",
           "--python", "/input/render_clip.py", "--", "--glb", "/input/model.glb", "--out", f"{out}/f",
           "--angles", ",".join(str(a) for a in cfg["angles"]), "--pass", cfg["pass"],
           "--engine", cfg["engine"], "--width", str(cfg["width"]), "--samples", str(cfg["samples"])]
    if cfg.get("contour_only"):
        cmd.append("--contour-only")
    p = sp.run(cmd, capture_output=True, text=True)
    files = {os.path.basename(f): open(f, "rb").read() for f in sorted(glob.glob(f"{out}/*.png"))}
    log = (p.stdout + "\n--- stderr ---\n" + p.stderr)
    return {"shard": cfg["shard"], "exit_code": p.returncode, "png_count": len(files),
            "seconds": round(t.monotonic() - t0, 2), "log_tail": log[-3500:]}, files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--angles", default="0:360:2", help="start:stop:step in degrees (stop exclusive)")
    ap.add_argument("--pass", dest="which", default="both", choices=["line", "shade", "both"])
    ap.add_argument("--engine", default="workbench", choices=["workbench", "cycles"])
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--samples", type=int, default=24)
    ap.add_argument("--contour-only", action="store_true")
    ap.add_argument("--shards", type=int, default=1)
    ap.add_argument("--cpu", type=int, default=4)
    ap.add_argument("--memory", type=int, default=8192)
    ap.add_argument("--timeout", type=int, default=1500)
    ap.add_argument("--est-s-per-frame", type=float, default=30.0, help="assumed wall seconds per frame per pass")
    ap.add_argument("--max-usd", type=float, default=0.0)
    ap.add_argument("--execute", action="store_true")
    a = ap.parse_args()

    glb, out = Path(a.glb), Path(a.out)
    angles = parse_angles(a.angles)
    passes = 2 if a.which == "both" else 1
    per_sec = a.cpu * CPU_RATE + (a.memory / 1024) * MEM_RATE
    est_seconds = len(angles) * passes * a.est_s_per_frame + a.shards * 90  # + import/startup per shard
    est = round(est_seconds * per_sec, 4)
    ceiling = round(a.shards * a.timeout * per_sec, 4)
    request = {"schema": "armament-clip/1", "glb": str(glb), "glb_sha256": sha256(glb), "blender": BLENDER_VERSION,
               "angles": [angles[0], angles[-1], len(angles)], "pass": a.which, "engine": a.engine, "width": a.width,
               "shards": a.shards, "cpu": a.cpu, "memory_mb": a.memory, "estimate_usd": est,
               "ceiling_usd": ceiling, "max_usd": a.max_usd}
    print(json.dumps(request, indent=1))
    if not a.execute:
        print("DRY RUN: no cloud call. Add --execute --max-usd X to spend.")
        return 0
    if ceiling > a.max_usd:
        print(f"REFUSED: worst-case ceiling ${ceiling} is above --max-usd ${a.max_usd}")
        return 2
    if out.exists() and any(p.name != "request.json" for p in out.iterdir()):
        print("REFUSED: output dir not empty:", out)
        return 2
    out.mkdir(parents=True, exist_ok=True)
    (out / "request.json").write_text(json.dumps(request, indent=1), encoding="utf-8")

    import modal

    # serialized functions need the image Python to match the local one (Modal InvalidError otherwise)
    image = (modal.Image.debian_slim(python_version=f"{sys.version_info.major}.{sys.version_info.minor}")
             .apt_install("wget", "xz-utils", "libglu1-mesa", "libxi6", "libxrender1", "libxfixes3", "libxcursor1",
                          "libxinerama1", "libxkbcommon0", "libsm6", "libxxf86vm1", "libgl1", "libegl1",
                          "libgl1-mesa-dri")
             .run_commands(
                 f"wget --timeout=120 --tries=3 -q {BLENDER_BASE}/{BLENDER_ARCHIVE} -O /tmp/blender.tar.xz",
                 f"wget --timeout=60 --tries=3 -q {BLENDER_BASE}/blender-{BLENDER_VERSION}.sha256 -O /tmp/b.sha256",
                 f"cd /tmp && grep ' {BLENDER_ARCHIVE}$' b.sha256 | sed 's#{BLENDER_ARCHIVE}#blender.tar.xz#' | sha256sum -c -",
                 "mkdir /opt/blender && tar -xf /tmp/blender.tar.xz -C /opt/blender --strip-components=1",
                 "rm /tmp/blender.tar.xz")
             .add_local_file(SCRIPT, "/input/render_clip.py")
             .add_local_file(glb, "/input/model.glb"))
    app = modal.App("studiomark-armament-clip")
    fn = app.function(image=image, cpu=a.cpu, memory=a.memory, timeout=a.timeout, startup_timeout=900,
                      max_containers=a.shards, retries=0, serialized=True)(render_shard)
    cfgs = [{"shard": i, "angles": c, "pass": a.which, "engine": a.engine, "width": a.width, "samples": a.samples,
             "contour_only": a.contour_only} for i, c in enumerate(chunks(angles, a.shards))]
    started = time.monotonic()
    results = []
    with modal.enable_output(), app.run():
        for res, files in fn.map(cfgs):
            results.append(res)
            for name, data in files.items():
                (out / name).write_bytes(data)
    wall = round(time.monotonic() - started, 1)
    secs = sum(r["seconds"] for r in results)
    got = len(list(out.glob("*.png")))
    expect = len(angles) * passes
    status = "rendered" if got == expect and all(r["exit_code"] == 0 for r in results) else "failed"
    summary = {"status": status, "png_expected": expect, "png_got": got, "wall_seconds_local": wall,
               "container_seconds": round(secs, 1), "cost_measured_usd_rate_derived": round(secs * per_sec, 4),
               "shards": results}
    (out / "result.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "shards"}))
    if status != "rendered":
        for r in results:
            print(f"--- shard {r['shard']} exit {r['exit_code']} ---\n{r['log_tail']}")
    return 0 if status == "rendered" else 1


if __name__ == "__main__":
    sys.exit(main())
