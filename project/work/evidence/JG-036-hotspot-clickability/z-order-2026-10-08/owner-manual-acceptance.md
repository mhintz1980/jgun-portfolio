# Owner manual hotspot checkpoint — 2026-10-08

Owner scope: revive one hotspot per assembly for manual browser verification; add further hotspots in a separate task. Current inspect camera/card/scroll/parallax behavior is preserved.

Updated preview: `http://localhost:5203/?qualityLock=1`, integrated assets `index-BP95EhKL.js` and `SceneCanvas-DZeZz-e1.js`. Instructions named rotor around 49% scroll, intake around 75%, barrel trunnion around 83%.

Asked whether those three badges were visible/clickable, the owner replied: **"yes they work"**. This records manual functional acceptance of the narrowed three-hotspot scope. No extra keeper or inspect redesign is requested.

**Follow-up correction:** owner reports all visible hotspots click successfully, including approximately 7–8 enclosure checkpoints and 4 M249 checkpoints; only the wrench shows the intended single checkpoint. Clickability is owner-confirmed, but the one-per-assembly scope is **not yet met**. The ACTIVE_HOTSPOT_IDS filter covers one producer only; parallel clickable checkpoint producers must be traced and gated before scope completion. This correction supersedes any reading of the initial response as total-badge-count acceptance.

**Latest owner clarification supersedes the restriction above:** "i dont mind the others being active, i wanted you to know in case it meant there was a bug in your 'single fix per section' code." Preserve additional working checkpoints. The selected three guarantee a tested assembly path; they do not require removal of other existing functioning controls. Inspect the producer/count discrepancy and correct documentation; do not suppress extra badges. Manual clickability remains accepted; automated regression guard stays separate.

Quality lock was used for this manual functional preview; it does not close natural-tier/performance G6. Automated camera-goal/exit/keyboard regression evidence remains pending correction and rerun, separately from this owner confirmation.
