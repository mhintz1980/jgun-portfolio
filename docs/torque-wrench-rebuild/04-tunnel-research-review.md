# Tunnel diagnostic — independent Astra review

Decision input: PASS for the bounded hardware/full diagnostic evidence; the tunnel appearance is not visually accepted. Independent reviewer: native Codex `tier-reviewer`, Astra/medium custom pin, agent `01a12433-353c-7c72-8a02-a37b8629ecc7`. Backend identity/effort is not independently exposed beyond the role/tool configuration.

Review date: 2026-10-10. Read-only review; no GPU/browser/build/source changes by the reviewer.

## Corroborated evidence

- Five checkpoints `.84/.86/.90/.94/.98` in `project/work/evidence/torque-wrench-rebuild/01-tunnel-diagnostic/full/` match the aggregate report.
- Pre/post snapshots: AMD Radeon 780M / D3D11; `full`; `qualityLock=1`; attached unchanged live canvas/context; correct phase/progress; both portal materials have `uPortalLite=0`.
- Actual scene-render counters advance across every screenshot bracket; no capture errors or context events recorded.
- Manifest, harness, reference-image and captured-PNG hashes match disk; five original-response `Default.glb` bodies match disk SHA-256 `8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257`. Baseline HEAD `666cbf23d490352dc549b4730d3e9d14e042a5a4`; tracked diff empty.
- Position/FOV settling: 1.64–1.85 seconds. Orientation residual is recorded and small, but not an acceptance gate.
- Resource accounting: 755 original-response bodies, 10 guarded cache refetches, 125 internal transports. Refetches explicitly retain matching ETag/content-length and unchanged compressed source identity plus matching decoded entity hashes. Earlier failed bookkeeping attempts remain preserved.

## Pixel assessment — machine interpretation, inspected last

At `.90` and `.94`, exposed tunnel surfaces read as broad pale blue-grey areas with smooth shading/banding and sparse bright seams. The target shows chunky irregular rock masses and richly fractured cavern walls. The `.90` result closely resembles the historical rejected appearance. At `.86`, the emerging dark model obscures most of the opening and weakens wall-texture assessment. Light-blue edge illumination is visible; hue alone does not establish matching electrical character.

**Defensible conclusion:** the unwanted appearance persists under identified hardware rendering with full portal shading. Software rendering or lite tier alone cannot explain it. This is not a controlled historical hardware/software A/B; the specific shader, geometry, lighting or occlusion contribution remains unresolved.

Direct source reads corroborate rock colour endpoints, 3.2 m shaft depth and a 1.8 mm relief parameter (`src/scene/drawing/sheet/portalGeometry.ts:39`), plus procedural rock/fissure shading (`src/scene/drawing/sheet/portal.ts:89`). These definitions do not prove the desired appearance or conclusively explain the mismatch.

## Boundaries

- Render-call advancement proves fresh rendering activity, not GPU completion or exact compositor-frame identity.
- Browser and Node wall clocks differ by a few milliseconds; code sequencing supplies the bracket, not precisely synchronized cross-process timestamps.
- Guarded refetches are corroborated replacement observations, not recovery of original-response bytes.
- Headless dev runtime, lock, instrumentation and screenshots do not certify natural full-tier selection, sustained performance or closure of the inherited tier-drop issue.
- `capVisible=false` and these PNGs alone do not prove bottom-free rendering or removal of every unwanted feature.
- Motion recordings, pause/reverse behavior, effective Lenis response and C¹/C² continuity were not part of this completed tunnel review.
- Inventory correctly separates Lenis duration, GSAP numeric scrub, camera damping/rest orbit and scroll assist. Hero tween insertion times are timeline positions, not global-progress boundaries.
- Coverage was stale/untracked/excluded; conclusions rely on direct reads and exact-file checks, not an assertion of graph freshness/completeness.

No blocking finding for the bounded tunnel conclusion. Owner visual acceptance remains open; no effect is marked done. Research-phase acceptance and approval to enter design remain separate owner decisions.
