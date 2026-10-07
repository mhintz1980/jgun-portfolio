# JG-035 opening verifier triage - headed vs headless rosters (2026-10-06, GLM leaf)

> Correction (2026-10-06 followup, per opening-triage-final-followup.md): the original
> verdict claimed a proven headed-window harness fault and "not an app defect." That
> causal claim was unsupported - the quick-trial narrow pass and desktop-lite retention
> cannot exclude an app-side contribution. The launcher now simply matches the sibling
> manufacturing verifiers; both failed rosters are preserved as prior-policy history.
> See ../opening-triage-final-followup-report.md for the corrected record.

## Verdict (corrected)

The opening verifier was the only manufacturing verifier launching **headed** Chrome; it
now launches headless like verify-shaft-inspection.mjs, verify-manufacturing-inspection.mjs
and verify-ring-inspection.mjs (identical channel 'chrome', --use-angle=d3d11, background
flags, DPR 1). Viewports, DPR, thresholds, tier expectations, and the app's adaptive
ladder are untouched. Observed, without causal attribution: the headed roster failed
(opening-contact-final) and the headless roster produced the different results tabulated
below while retaining the desktop full-tier failures. What differed between the two
launch modes was not isolated beyond window mode itself; no claim is made that headed
presentation was the sole cause, that a "false cascade" occurred, or that no app
regression exists.

**Retained failure: desktop full-tier gate (cause not established).** Measured: at
harness DPR 1 the DPR staircase is a single step (DPR_STEPS = [MAX_DPR, 1.5, 1.25, 1]
clamped to device ratio), so a single sustained sub-45-FPS window takes 1600x900 desktop
straight to lite under the one-way ratchet. In both rosters desktop read lite with
declines=1 from the first checkpoint - inside the ~21-25 s cold-load window - and stayed
lite for the entire headless pass (never poster, canvas live at the final checkpoint).
Narrow 390x844 held full headless. Whether that cold-load frame cost is machine-bound or
app-bound was not determined here; the parent's shaft runs also recorded "desktop
effective lite." Per constraints: no tier-locking, no fake tier/FPS, no threshold change;
the failure is preserved pending owner decision.

## Headed (opening-contact-final) vs headless roster (same build, same :4173 preview)

| Case | Headed final | Headless final (this packet) |
|---|---|---|
| desktop | lite -> poster, canvas dead at cp05, 6 reverse "mismatches" (empty deltas, never compared), 12 failures | FAIL - 110 failures, **all** "expected full tier, got lite" (86 forward + 24 pinned); canvas live at last checkpoint; declines=1 stable; reverse 43/43 exact-zero deltas, fragment transforms compared at 9 points |
| narrow | canvas dead at first checkpoint | **PASS** 0 failures |
| desktop-reduced / narrow-reduced | PASS | **PASS** 0 failures |
| desktop-lite / narrow-lite | TimeoutError 10000 ms (forced-tier wait) | **PASS** 0 failures |

Errors/httpErrors/contextLosses/shaderFailures = 0 in every headless case (measured in
each case JSON). The headed record's reverse entries never executed their comparisons
(empty deltas, compared: false, canvas inactive) and its forced-lite cases timed out at
the 10000 ms tier wait; in the headless record the same comparisons ran, all 43 passed
with exact-zero deltas, and both forced-lite cases passed. These are observed differences
between the two records; no mechanism is claimed.

## Commands and exits

- Trial: node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:4173 --out=<packet>/headless-quick-2026-10-06T23-14-06-009Z -> exit 1 (desktop tier-lite only, 64; narrow PASS)
- Syntax: node --check scripts/verify-jgun-opening.mjs -> exit 0
- Full roster: node scripts/verify-jgun-opening.mjs --url=http://localhost:4173 --out=<packet>/headless-final-2026-10-06T23-20-17-611Z -> exit 1; 5/6 cases PASS; desktop retained failures as above; 23:20:18Z-23:34:50Z; Chrome 154.0.8037.98; build index-DFY-biXM.js served.

## Launcher diff (only change to the verifier)

headless: false -> headless: true plus comment. Pre-edit snapshot kept at
verify-jgun-opening.pre-headless.mjs in this packet. Nothing else in the script changed.

Followup (same day): the launcher comment's causal wording ("trips the ... ratchet ...
harness false cascade, not an app regression") was retracted and replaced with
contract-match wording, and the two reduced-motion cases were rewritten for the owner's
posters-throughout decision (exact assertions in ../opening-triage-final-followup-report.md).
Final verifier SHA-256 after the followup edits:
D065390A2F9F0037CD9802499E7615C3D6E6EC452617675DAC9E9A4A7986A068 (node --check exit 0).
The 92C1F245... hash in the table below is the intermediate state kept for history.

## Hashes (SHA-256)

| File | Pre-edit | Post |
|---|---|---|
| scripts/verify-jgun-opening.mjs | 1A4FC52D59936322EFC40C41033FBC4FCF76A411DC550579FF7FFB778E9156D4 | 92C1F245C0918AFC6E1485E5E48358C74843E02DADAE2E96575A3DF84C0B10D3 (edited) |
| src/scene/SceneCanvas.tsx | 54C2A6B5DB57BE460368F9D4DFEFDD208B00E310AA1BA23AF0B388EA7AAEAF0A | unchanged |
| src/state/qualityStore.ts | 3D8F7794262A67D63A0C4DD8D23414C4737CA824DA36890E4F1BDCC902A4D5D2 | unchanged |
| dist/assets/SceneCanvas-CoJldWVG.js | 641F354225FF5A4FA4C538020A39D63A99D95D38DD176A69DAB615AF83667ADE | unchanged |
| dist/assets/index-DFY-biXM.js | 457DA03DE2ACE03A6C6B983A90972D6150846931481E7658C4EEE208CA8AB309 | unchanged |

Note: "unchanged" means unchanged by this triage session. The sibling posters-throughout
worker began editing src/App.tsx, src/components/StaticPoster.tsx and
src/state/qualityStore.ts during the followup (qualityStore drifted to
3BAB839E... between two reads); those files are theirs and are not covered by this table.

## GPU release

Both runs closed via browser.close(); no Playwright/headless chrome processes remain
(Win32_Process census: the 17 chrome.exe processes all belong to the user's pre-existing
desktop Chrome, main process started 17:47 local, real profile - untouched). The :4173
preview server was left running. No git stage/commit/push; no app source, policy, or
threshold mutated; packet contents are this report, summarize.mjs (JSON summarizer),
the pre-edit snapshot, and the two run directories.
