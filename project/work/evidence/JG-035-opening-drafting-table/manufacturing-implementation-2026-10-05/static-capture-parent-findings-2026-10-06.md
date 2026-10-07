# Static capture correction and routing escalation

The GLM static worker's completed 17:47:30Z capture report still fails desktop/narrow with camera drift and missing-trigger timeouts, after distinct URL/settling corrections. No public raster assets existed at this checkpoint. Parent stopped only its verified CLI PID 3272 (command names continuation-static-glm-report.md), preserving all source/evidence. Ownership transfers to a fresh native OpenAI worker; no successful static completion is claimed.

Fresh read-only audit found the capture race: the helper accepted repeated matrix reads without requiring distinct completed renders. A stalled renderer satisfies that condition; screenshot can resume the entry blend. CameraRig continues blending while entryElapsed < 1.2, and elapsed advances while paused. This is inadequate capture synchronization, not established runtime drift.

Correction algorithm: isolated GPU context, one inspection session for support pair; wait for real entryElapsed >= 1.2; seek using native input setter/events; require three distinct completed renders with matching session/paused/ready/time and sample/camera stamps plus stable world/projection matrices. Hide DOM, repeat frame checks, capture, compare subsequent completed frame. Support times are exactly 35.8 and 38.2, identical authored anchors. Abort promptly on error/context loss/poster transition. Do not override authored camera pose or edit runtime to manufacture proof.

The dedicated verifier's completed-render observer provides the proven synchronization surface. Parent will integrate/rebuild after camera, metadata, static assets and verifier source are ready. Production proof remains separate from dev captures.
