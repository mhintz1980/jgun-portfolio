# Gates: G0 camera and tool conventions

Scope: Concrete camera blockout and explicit measured/illustrative/unresolved tooling registry.

- [x] C1: Establish reference-backed signed generating conventions and compatible illustrative shaper/hob dimensions; explicitly record unresolved production specifications.
  EVIDENCE: camera/tool-conventions.md (conventions), camera/profile-study.log MATCHED_SHAPER N=20 C=15.5 (signed ratio work/cutter -2; generating-fit diagnostic max unremoved stock 0.0665730 mm, rms 0.0066510 mm, explicitly not Euclidean clearance). Certified blocks in camera/clearance-v4/report.json (verdict CERTIFIED): shaper N=20, C=15.5, tip 11.2032 mm, t 1.2 mm, stroke centre 2.17..9.7749 mm, overtravel 0.5 mm, backoff 2.0 mm (exaggerated); hob single start, module 1 mm, R 5.87 mm, lead 5.5587 deg, stop yc 9.5249 mm, centre distance 10.1618 mm, collar 6.87 / arbor 4.37 mm, length 16 mm, ramp reproduction max |envelope - approved floor| 0.0048616 mm, rms 0.0036270 mm over 426 stations. The earlier "lead 5.52 deg, R 5.88, max dev 0.0066 mm" figures appear in no certified report and are superseded by these values. Production tooling unresolved and stated in clearance-v4/README.md "Not claimed". Independent review: DeepSeek FIX-FIRST -> fixed -> re-review SHIP (C3, camera/clearance-v4/independent-rereview-deepseek.md); ../final-glm-integration-review.md SHIP.
- [x] C2: Produce desktop and 390x844 camera blockout with projected shaft/exit/tool framing and card-safe regions.
  EVIDENCE: camera/blockout-2026-10-06 records the original narrow material-card
  collisions and their independent live-matrix reproduction. camera/footer-fix-2026-10-06
  additionally fixes desktop material/heat-card footer and narrow heat-card footer
  collisions. Independent decoded projections pass 8/8 with >=8 px card/footer
  clearance; camera tests pass 12/12 and the parent camera/story/store suites pass
  31/31. Final camera SHA256 0b5952f3f31bffbdf626965204e3a2b0a0c2c7443b593de728616e0b5af6203a.
  Rendered same-session production shaft proof now passes in runtime/shaft/contact-parent-run-1/2,
  S2/S8:13 completed-frame canvas captures per viewport/run, actual target draw and projection
  witnesses with matching epoch/time/stamps and nonblank statistics. Camera hash matches the
  independent8/8 card/footer projection proof. Technical C2 is checked; owner visual acceptance remains open.
- [x] C3: Swept tool clearance is measured with uncertainty or explicitly unresolved and blocks unsupported choreography acceptance.
  EVIDENCE: scripts/manufacturing/tool_clearance_meridian.py -> clearance-v4/report.json "G0_CLEARANCE_V4 CERTIFIED pairs=24 fail=0", deterministic (report-run1.json identical except timestamp). Hob vs journal side d 0.1187 e 0.0225; turned cone 0.0950; shaper groove floor 0.130, return 0.213 (e 0.0163). DeepSeek review FIX-FIRST -> fixed -> re-review SHIP; residual items answered in clearance-v4/README.md. clearance-v3 invalid and superseded (PLAN status log).
- [x] C4: Record source/bundle triangle-byte-call budgets and reproducible camera/blockout commands.
  EVIDENCE: camera/blockout-2026-10-06/README.md - bundles full 678,008 bytes / 95,183
  triangles / 8 primitive calls and lite 415,424 bytes / 49,706 triangles / 8 primitive
  calls (independent decode: assets/acceptance-2026-10-06/draco-report.json); per-anchor
  runtime rendered calls 1..28 / triangles 12,671..298,405 in the blockout report.json;
  reproducible commands for capture/measure/candidate/independent-check/reclassification
  documented in the README.
