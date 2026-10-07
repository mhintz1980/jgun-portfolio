# Shaft poster metadata entry fix — 2026-10-06

The static shaft entry called `getStory('shaft-p001835')` before the canvas module could register its runtime descriptor. The registry now falls back to the existing immutable authored `shaftStory` metadata. Its only reverse import is `import type { StoryMetadata }`, so loading the registry adds authored data without importing a runtime factory, Three.js values, or CAD assets.

Changed `src/scene/inspection/story.ts`, `story.test.ts`, and (after the parent extended ownership) `src/state/inspectionStore.test.ts`. No store implementation changes. Runtime descriptor lookup still returns only registered descriptors. Runtime registration validation, immutable copies, duplicate rejection, and unregister behavior remain intact. An active registered shaft descriptor takes precedence; unregistering it restores authored metadata with no `create` member.

The cold-registry test resets Vitest's module cache and imports only the registry and authored shaft data. It verifies no runtime descriptor, no fake factory, the complete chapter table, immutable metadata, and the full/lite asset URLs. Chapter starts remain **0, 15, 22.6, 35 seconds**, with a **43-second duration**.

The stale store assertion that shaft entry must throw was replaced with a fresh-module static entry test. It enters chapter 2 at 22.6 seconds without registering a runtime descriptor, verifies shaft identity, 43-second duration, ready status, static phase, paused playback and null runtime, then exits and verifies session abortion, cleared references, and exact narrative context restoration. Registered-runtime coverage is retained.

## Verification

- `npm run typecheck`: passed (exit 0).
- `npm test -- --run src/scene/inspection/story.test.ts src/state/inspectionStore.test.ts --maxWorkers=2`: **19 passed across 2 test files** (exit 0).

Production zero-CAD network proof, poster entry, dialog focus, and focus restoration remain assigned to the parent/verifier; this scoped change does not claim those browser checks.
