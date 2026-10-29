# Owner-directed label suspension — 2026-10-28

Implemented the label lane from `docs/torque-wrench-rebuild/68-close-tool-suspended-labels-camera-consultation-2026-10-28.md`.

## Changes and ownership

- `src/scene/torque-wrench/hotspotData.ts`: added `ring-switch` and `stage2-planet` to the existing `TORQUE_HOTSPOTS_DISABLED` set; retained `clutch-housing`; documented reversible owner suspension. LCD remains enabled.
- `src/scene/torque-wrench/hotspotData.test.ts`: updated suspended checkpoint expectations; checked all three disabled IDs throughout progress 0–1; checked the DOM sample gate with visible anchors and existing focus; retained an active LCD checkpoint and exercised its manual/study/ring/opacity/invalid-progress gates.
- This evidence file. No write ownership expansion or separate DOM test edit was needed.

The live runtime uses `isTorqueHotspotActive` for selection, focus release and anchor projection. `TorqueInspectionOverlay.tsx` uses `isTorqueHotspotActiveForSample` for card, keyboard-focus and pointer visibility. Both reach the disabled set. Those consumers were inspected but not edited.

## Actual verification

Command: `npm test -- src/scene/torque-wrench/hotspotData.test.ts`

Exit code: 0. Output:

```text
> jgun-portfolio@0.1.0 test
> vitest run src/scene/torque-wrench/hotspotData.test.ts

 RUN  v4.1.11 C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  18:46:54
   Duration  897ms (transform 122ms, setup 0ms, import 190ms, tests 350ms, environment 0ms)
```

Preserved-data check: compared the live `hotspotData.ts` against `git show HEAD:src/scene/torque-wrench/hotspotData.ts` after normalizing line endings and reversing only the two-ID set addition and two comment lines. The file was clean at intake. Exit code: 0. Actual output:

```text
PASS: hotspotData.ts is identical to its pre-change source except the disabled set and owner comment; all identities, copy, FCF, windows, reveal and layout retained. Runtime/DOM anchor sources untouched.
```

`git diff --check` for both source files produced no output. No build, browser, server, global test, asset modification, staging, commit, push or deployment was performed. Drafting-sheet labels, camera, pacing, geometry and other agents' edits were untouched.

## Release

Label lane complete; ownership of both source files is released for parent integration. Reactivation requires removing the relevant IDs from the disabled set and restoring the corresponding test expectations. No unresolved issue in this lane. Browser/visual acceptance and parent-owned framing/notebook work remain outside this lane's verification.
