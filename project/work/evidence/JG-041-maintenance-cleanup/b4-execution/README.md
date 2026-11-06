# JG-041 B4 — executed legacy-root retirement subset

Authority: Mark explicitly approved executing B4 deletions in small verified batches after the retention-planning checkpoint. No push, merge or deployment is authorized or performed here. Execution is isolated on `codex/jg041-b4-retirement`, based on `2c74315005d83caf6d381a77c5829521f729ac9c`; the original shared checkout and its concurrent work are protected.

## Actual removals

Seven files removed, with exact hashes, Git blob bytes, original Windows checkout bytes and full recovery anchors in [deletion-manifest.json](deletion-manifest.json):

- `src/main.tsx` — no HTML/build entry, explicitly forbidden by the root topology test.
- `src/data/glb-manifests.json` — unread generated snapshot; retained e2e generator only writes it. ProductStage's provenance comment now names the exact historical commit/path.
- `src/App.tsx` — only live tool import was check-fallback; that check now renders the current torque page. The retained shaft verifier's source/hash manifest now names the real page, cadGate and tier owners, while preserving its assertions.
- `src/components/IntroTitles.tsx`, `src/components/ToleranceStations.tsx`, `src/scene/SceneCanvas.tsx`, `src/scene/ScrollRig.tsx` — direct/lazy importers were solely the retired App. No retained test/tool source reader or esbuild entry requires them. Remaining mentions are comments, historical source snapshots or defect metadata; historical evidence is unchanged.

The first two removals were independently reviewed and approved before the larger subset. The parent rejected an intermediate reader suggestion to delete seven hosts while App still imported them; closure was established only after migrating the tool and retiring App itself. Nothing was removed on the basis of that invalid suggestion.

## Guarantees and tooling

The [fallback mapping](fallback-mapping.md) records each of the seven App-specific SSR checks against current poster DOM. All twelve component loading/accessibility assertions remain unchanged, including stalled boot fault/progress, pointer transparency, native buttons, ARIA, focus and tab order. All 19 checks pass. The fixture explicitly selects poster tier: it is SSR poster composition proof, not browser WebGL detection proof. Current scene failure/tier/renderer unit tests and reduced-motion browser smoke supply complementary evidence; no stronger browser fallback claim is made from SSR.

The shaft verifier still hashes all surviving authored inputs, adds current page/cadGate/tier, and retains every mechanical/replay/privacy assertion. Its historical App recovery anchor is explicit. Its 44 literal source paths resolve. Manufacturing verifier changes are defect attribution/comment changes only, pointing at current scene/page owners; no assertion or threshold was removed or loosened. Prior failure reports and source hashes remain historical evidence.

No production page module, shared rig/RL300/inspection/drawing module, shader, animation ladder, protected CAD asset, media/font, package/lockfile or test was removed or changed. The only surviving component edit is the ProductStage provenance comment. No Remotion source or shared import closure changed, so Remotion install/typecheck/render was not needed.

## Checks

- Isolated working-tree root typecheck: exit 0.
- Affected Vitest: 13 files / 291 tests pass (shared route/privacy/poster/shell, staticChapter, visual gates, tier, scene lifecycle and renderer).
- Pure Node verifier tests: all five files / 36 tests pass, repeated after the final source changes.
- Migrated fallback script: esbuild bundle with CSS empty/packages external, then Node; 19/19 pass. Both edited verifier scripts pass `node --check`; all 44 literal shaft-verifier paths resolve.
- Production build: exit 0 before and after the second subset; standard >500 kB chunk warnings remain. Tailwind removed unused utility rules, so the shared CSS hash changed; this is why the built-page smoke is repeated on the final build.
- First-subset focused public smoke: 9/9 cases pass (desktop/narrow/reduced-motion × home/torque-wrench/quiet-machine), zero fatal or HTTP errors, navigation exercised. Armament browser check passes: noindex,nofollow, no canvas, no private navigation link. Root and RL300 query redirects pass, including retained query/hash.
- Final-build smoke: 9/9 pass again with zero fatal/HTTP errors and working navigation. Final armament privacy and both root redirects pass again. Asset gate: five HTML entries, no missing linked assets, no hashed Draco duplicates and M249 excluded.
- Exact `ac3cade5af3c1ec1f1e38af1f28dcd8b02052812` commit tree checked in a second detached checkout: root typecheck exit 0 and all five Node suites / 36 tests pass, clean status. The dependency junction points to the earlier clean-installed cleanup dependency tree with identical package/lock hashes; no dependencies changed. [validation.json](validation.json) records these results. This final follow-up changes evidence only; its exact tree is also checked before delivery.
- [Independent review](independent-review.md): first subset approved; expanded subset otherwise approvable with one exact source-line attribution correction, which the parent confirmed and fixed. No fallback-coverage or deletion-closure flaw found.

Only a cleanup-owned preview on port 5286 and cleanup-owned output prefixes are used. Preview is restarted after each rebuild. Browser checks wait for scene readiness before sampling. The original shared dist, existing port 4173 services and other owners' files are untouched.

## Recovery and remaining B4 work

Recover a removed source with `git show 2c74315005d83caf6d381a77c5829521f729ac9c:<path>`. Git history is the recovery source; no inactive TS copy was added to the typechecked tree. This removes checkout/source bytes, not Git history.

B4 is partially executed, not fully complete. CinematicRigRoute/ProductStage/CameraSplineStudio/rigRequest and the old manifest/replay spec remain reserved to preserve unique sandbox assertions pending their own retirement decision/mapping. BootSequence/Hotspots/TechnicalHUD and the legacy components exercised by retained tests remain. Older verifier campaigns, station/mechanical code and output directories are not mass-deleted. Each later subset needs its own relevant consumer closure; unrelated unresolved imports do not block an otherwise closed subset.

Initial planning evidence remains in the original shared checkout at `project/work/evidence/JG-041-maintenance-cleanup/b4-retention/` as a dated snapshot; it is not rewritten to pretend the earlier all-KEEP state was a deletion approval. This execution record supersedes that checkpoint only for the seven explicit manifest paths under Mark's subsequent instruction.

Preservation recheck: original shared HEAD/remote remain `2c743150`, tracked/staged diffs are empty there. All active-owner files remain in place. During this execution the showcase owner changed its own plan, MP4/WebM and assembly/verification scripts; those changed hashes are concurrency, not cleanup edits. No creative source/media was copied into or staged from the shared checkout. The deletion worktree contains only owned cleanup changes and remains separate pending any later integration instruction.

## Delegation

Accepted session roster retained: GLM-5.3 Flash/low read-only next-subset analysis; Sonnet-5.5/medium bounded fallback migration; GLM-5.3/high fresh independent review of the OpenAI parent diff. No frontier arbitration seat or external messaging used. The reader's invalid closure claim was rejected and corrected. Worker owns only the fallback script/mapping; parent owns deletion, verifier references, integration and verification. Requested model/effort is recorded, backend identity/effort and cost savings are not independently observed.
