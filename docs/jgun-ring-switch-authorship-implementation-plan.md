# Ring Switch manufacturing sequence + authorship layer — JG-035 implementation plan

Owner direction 2026-10-04 (see [implementation handoff](../project/work/evidence/JG-035-opening-drafting-table/knurling-tool-2026-10-04/implementation-handoff.md)). Scope is the six handoff items only; it does not approve later-chapter ideas from the owner brief. Status is tracked here and summarized under JG-035 in `TODO.md`. Nothing below is owner-accepted until the integrated site is ruled on.

## Ground rules carried from the handoff

- Part numbers are the identity key (P003068 ring, P000464 pins, K000156 ball plungers). Ladder, explosion offsets and the `ring-switch` unit grouping stay untouched.
- The tool GLB is a separate prop (`knurling-tool.glb`; units `KT_TOOL_ROOT`, `KT_UPPER_HOLDER`, `KT_LOWER_HOLDER`, `KT_UPPER_KNURL_WHEEL_RH`, `KT_LOWER_KNURL_WHEEL_LH`; clip `KnurlTool_Approach_Contact_Traverse_Retract`). It is an animation prop, not certified tooling; its proportions are reference-derived.
- Black → aluminium → black is cinematic compression, not a depicted anodizing step. Planet inspection stays optional and unimplemented.
- Facts still open (do not assert): owner role/credit wording, undercut part/revision, .002/.0005/.0004 note association, anodize growth, spool alloy, prior cage reduction. Copy that depends on them ships as clearly marked placeholders or not at all.
- Cloud-session limits: no Blender, no `.scratch` brief, no `C:/` assets; the GLB and scripts in the evidence packet are the only tool sources. Browser verification runs against local Chromium.

## Design decisions (proposed — owner may overrule)

| Question | Proposal | Why |
|---|---|---|
| Camera owner | Extend the existing click-to-inspect path in `CameraRig.tsx` (§6, driven by `hotspotId`) with a `ring` inspection frame; no second camera writer | Handoff requires one camera owner; this path already restores the scroll pose on exit |
| Timeline placement | Opt-in macro first (outside the scroll timeline); it entry-stores `progress` and restores it. Scroll-pinned placement is a later owner call | Avoids touching the 3120vh track or any paced window |
| Knurl progression | Shader uniform `uKnurlProgress` (0→1 along axial traverse) on the existing `ringSwitch` material, extending the OD mask in `materials.ts` | Reuses the OD-only mask and cylindrical UVs; smooth lands preserved by clamping the band |
| Black/aluminium | Colour/metalness lerp on the ring material only, driven by the sequence clock | No new material instance for shared parts |
| Assembly fade | Reuse the ghost-fade mechanism for everything except the ring switch unit | Already measured and reversible |
| Reduced motion | Static end-state (knurled, black) plus text equivalent; no spin | Handoff: no forced rapid spin |

## Checklist

### 0. Baseline and registry
- [x] Read AGENTS.md, TODO.md, project README, spec map, tool packet; baseline 169/169 tests, typecheck clean (needs `@types/node`, see Open items).
- [x] Save this plan; link from TODO.md JG-035.

### 1. Identity and authorship
- [ ] Visible name + role line in readable DOM text from first paint (wording placeholder until owner supplies actual credit).
- [ ] Margin-note layer: DOM transcription of every note, restrained styling, formal drawing ink untouched.

### 2. Engineering decision story
- [ ] One concise first-person machining/undercut passage in the main narrative with optional expandable detail; anchored to the real part/feature, undecided facts omitted.

### 3. Ring inspection macro
- [x] Pure state machine `src/state/ringInspection.ts` (`idle → entering → inspecting → exiting`) with stored narrative context and unit tests (enter/exit, Escape mid-zoom, scroll lock, repeat entry, re-entry). Not yet wired to the camera or DOM.
- [ ] Click/tap/keyboard entry on P003068; focus-visible return control; Escape exits; focus returns to the entry control.
- [ ] `ring` inspection frame in `CameraRig`; scroll input locked or ignored while inspecting; restored pose verified by telemetry.

### 4. Manufacturing sequence
- [ ] Copy `knurling-tool.glb` to `public/models/` (committed, Draco/size budget checked, not added to `sync-assets.ps1`); loader + clip sampling.
- [ ] Sequence clock: zoom → assembly to darkness → black→aluminium + spin → tool contact → ~1–2 s traverse with progressive relief → retract/exit → spin decel → return to black + assembly returns.
- [ ] Tool clearance: wheels touch OD only during traverse, clear before exit; both wheel hands consistent with rolling direction.
- [ ] Smooth edge lands, bore and shoulders unchanged at every progress value.

### 5. Responsive + reduced motion
- [ ] 390×844, 768×1024, 1440×900 compositions; return control reachable on mobile.
- [ ] Reduced-motion and poster tiers: static equivalent, no spin.

### 6. Verification
- [ ] Unit tests (state machine, progress mapping, clearance numbers), `npm run typecheck`, `npm test`, `npm run build`, `npm run check:station2`.
- [ ] Fresh browser telemetry on a restarted `:4173` preview: enter/exit, restored pose, partial/full knurl, material boundaries, tool clearance, reverse scroll. Quick opening verifier (`--quick`, `localhost:5199`) as iteration evidence only.
- [ ] Evidence record under `project/work/evidence/JG-035-opening-drafting-table/`; owner visual ruling requested — not claimed.

## Open items / blockers

- `@types/node` is not in `package.json`; a fresh `npm ci` gives 5 typecheck errors (`Buffer`, `node:zlib`) in `paperGrain.test.ts` and `drawingCache.test.ts`. Pre-existing; fix or leave is an owner/maintainer call.
- Branch naming: handoff names `codex/jg033-signature-shot`; this cloud session works on `ccr-50494e4f-n9kq7i` (same commit `420198a` at start).
