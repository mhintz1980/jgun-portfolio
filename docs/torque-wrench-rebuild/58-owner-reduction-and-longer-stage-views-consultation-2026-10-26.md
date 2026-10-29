# Owner direction: true visible reduction and longer stage views

2026-10-26. Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
This consultation follows implementation/evidence 56/57. It does not close
owner acceptance or authorize Git delivery, deployment or asset regeneration.

## New owner direction

- Stage 2's carrier must turn at one fifth of the Stage 1 cage's integral sun,
  **P001836**. Mark explicitly confirmed that reference; it is not P001835,
  the original input-shaft sun.
- Remove the one-full-orbit-before-carrier requirement completely.
- Start input rotation more slowly, then accelerate as the view moves down
  the train. Hidden input teeth must not set the limit for later visible stages.
- Give each stage about 50% more viewing time during the pullback. A longer
  total duration is acceptable; physical scroll allocation must support it.
- Obtain **Opus 5.5 / High** advice first, then pass its findings to
  **Astra / High** for the recommended route. This is the owner's current
  model choice and supersedes the earlier restriction against Astra.
- Retain solid explosion housing, approved Stage 1 geometry and the
  deterministic, reversible, closed-form scroll contract. Preserve the dirty
  tree; no staging/commit/push/deployment/protected-asset regeneration.

## Verified baseline and key distinction

Current Stage 2 carrier speed is `.477530193 × P001836` (about 1:2.09).
It is `.091832729 × P001835`, so interpreting the owner’s new 1:5 against
the original input shaft would have caused the wrong correction.

The current private ladder in physical order 1/2/5/3/4 is
`1 / .477530193 / .228035085 / .108893638 / .052`, constrained to a 100:1
input/output presentation. The new local 1:5 requirement takes precedence;
the advisers must say whether the old total ratio should be retired.

Current dolly is 48.2–58 s (9.8 authored seconds, 76 mm travel). A direct
50% stretch is 14.7 seconds. Current native continuation allocation is about
6386 desktop / 6004 narrow CSS pixels. Authored seconds alone do not add
physical viewing time: the `.815–.825` scroll allocation must be considered.

The previous 158 RPM cap came from the original input sun's 18° half-pitch
bound at a measured nominal 60 Hz pace. New recommendations must consider
which actual features are visible, and prove hidden status with rendered
contribution/occlusion evidence before using higher late input RPM.

## Consultation progress

- [x] Refresh current source, dirty state and graph coverage; graph generation
  2026-10-25 is stale, so current source is authoritative.
- [x] Confirm P001836 as the owner's reference.
- [x] Dispatch Opus 5.5 / High, read-only.
- [x] Record Opus recommendation and its source/geometry assumptions.
- [x] Send that recommendation and owner constraints to Astra / High.
- [x] Record Astra's recommended route, numerical timing/ratio proposal and
  implementation/verification scope for the owner.

No animation-source changes are made by this advisory pass.

## Opus 5.5 / High proposal

Full response: `output/playwright/owner-corrections/58-opus-high-recommendation.md`.
Requested/configured route: `anthropic/claude-opus-5-5`, reasoning `high`,
native configurable subagent. This records tool configuration, not a backend
identity inferred from the model's prose.

Opus recommends four local 5:1 reductions after the established Stage 1 law:
carrier speeds `1 / .2 / .04 / .008 / .0016`, total input/output 3250:1.
It proposes a 62.9-second study (14.7-second dolly), 50% more native scroll
per stage, constant-speed comparison windows followed by 3× input increases
(78 / 234 / 702 / 2106 RPM), geometry-derived downstream local planet laws,
and visibility-based alias bounds. It identifies camera rotation as a
possible contributor to the misleading apparent ratio, and warns that the
higher late drive makes the inherited visible rewind unacceptable. Its
proposed hidden shared reset, output phase matching, estimated camera angle,
and implied ring tooth counts require independent scrutiny and proof.

Astra has the complete Opus response plus the confirmed P001836 reference,
new owner constraints, exact current source and geometry evidence. Requested
CLI settings: `gpt-6-astra`, `model_reasoning_effort=high`, read-only ephemeral.

## Astra / High recommendation and selected proposal

Full response: `output/playwright/owner-corrections/58-astra-high-recommendation.md`.
Prompt and tool-event log: `58-astra-high-prompt.txt` and
`58-astra-high-events.jsonl` in the same evidence directory. The CLI completed
successfully at the requested model/effort; no extra dispatcher was used.

Astra supports the local 5:1 ladder and retiring the old 100:1 target, but
corrects two important points in Opus's proposal:

1. Uniform 3× input increases do not make all planet motion progressively
   slower. With measured tooth counts, world planet spin would increase from
   19.11°/s at Stage 5 to 24.15°/s at Stage 3.
2. Accelerating during a new cage's fade does not establish a clean comparison.
   Give the fully revealed cage a constant-speed hold, then accelerate during
   the transition to the next stage.

The recommended starting profile is therefore:

| Hero stage | Input RPM | Cage °/s | Planet local °/s magnitude | Planet world °/s magnitude |
|---|---:|---:|---:|---:|
| Stage 2 | 78 | 18 | 60 | 42 |
| Stage 5 | 234 | 10.8 | 29.91 | 19.11 |
| Stage 3 | 351 | 3.24 | 15.32 | 12.08 |
| Stage 4 / output | 877.5 | 1.62 | 9.72 | 8.10 |

Keep Stage 1 sun/carrier/local-planet at 5.2 : 1 : −3.5. After Stage 1,
carriers 2/5/3/4 use .2/.04/.008/.0016 of Stage 1's carrier. Animated total
input/output is 3250:1. This is a chosen presentation ladder, not a measured
manufacturing ratio or owner approval of every later 5:1 link.

Downstream planet increments follow the actual incoming-sun/planet tooth counts:
`ΔplanetLocal = -(S/P) * (Δdriver - Δcarrier)`, with registered offsets retained.
Local multipliers become -10/3, -36/13, -52/11 and -6 for stages 2/5/3/4.
The physical ring counts, pitch compatibility and triangle contact are not
established by the periodicity evidence; do not alter approved Stage 1 geometry.

### Timing proposal

Preserve behavior through 40.2 s. Keep the 42.4 s integral-sun reference and
use the close orbit as an orientation reveal, not as ratio evidence. During
the subsequent comparison holds, keep camera orientation fixed so its own
rotation does not distort the visible reduction.

| Event | Proposed seconds |
|---|---|
| Stage 2 cage | 48.2–49.1 |
| Stage 5 planets / cage | 49.1–50 / 51.5–52.4 |
| Bearing | 52.4–53 |
| Stage 3 planets / cage | 53–53.9 / 55.1–56 |
| Stage 4 planets / cage | 56–56.9 / 58.25–59.15 |
| Output fade | 59.15–60.65 |
| Straight 76 mm dolly | 48.2–62.9 (14.7 seconds, 50% longer) |
| Output composition hold | 62.9 onward |
| Exterior restoration | 67.4–68.9 |
| Total study | 68.9 seconds |

Comparison holds precede ramps: 49.1–50.6, 52.4–53.9 and 56–57.5.
Input ramps are 50.6–51.5 (78→234), 53.9–54.8 (234→351),
and 57.5–58.25 (351→877.5 RPM). Remove all orbit-completion gates;
the retained early planet-view duration has no minimum-orbit condition.

At the proposed final rate, output turns about 15.8° from fade start to study
end (about 13.4° while fully visible). These are calculated proposal values,
not measured runtime results; no half-turn target is introduced.

Implementation detail: separate an explicit dolly end of 62.9 s from the
total study duration of 68.9 s. The current camera denominator uses the
kinematics duration; changing only that duration would accidentally lengthen
the dolly to 20.7 seconds rather than provide the intended output hold.

### Physical scroll, visibility and source handoff

Allocate 1.5× baseline CSS travel to each matching stage-view window, measured
on both layouts, with the extra output hold separately funded. Starting budgets:
9579.289 / 9001.976 px desktop/narrow for the stretched continuation; with the
six-second output hold, about 12111.260 / 11381.353 px. A single multiplier
near 30.5151 is only an initial aggregate estimate, not a per-stage guarantee.
Solve both subject/camera clocks and native pacing together; preserve earlier
physical scroll offsets and verify monotonicity and seam derivatives.

The RPM profile is provisional. Use offline rendered-contribution evidence
to choose the closed-form envelope; do not introduce runtime visibility-based
state or per-frame angular accumulation. Bound the fastest visible feature:
input tooth band and sixfold features, planet tooth bands, arrays and integral
suns. Include actual depths, scheduled fades, both layouts/tiers and frame/boundary
samples. Existing drivetrain captures do not include the input shaft. Use the
complete exposed tooth band, not just the interior planes sampled for counting.
Use .35 feature periods/frame as a design target and .5 as the hard boundary
under the declared native pace. Re-measure after retiming; 158 RPM is not a
universal late cap when its controlling feature is hidden.

Prefer phase-matched source takeover: private and authentic source units have
the same shared drive phase and registered offsets at transfer. Hold that phase
until every affected visible surface is actually hidden before any shared reset.
Do not visibly rewind the larger accumulated drive, independently wrap gear angles,
or assume modulo-90° output/modulo-60° shaft symmetry without proving the entire
affected assembly. Keep main explosion housing opaque.

If real occlusion cannot support a proposed ramp, lower/delay it or adjust
framing first. Selective upstream disappearance and weakened later reductions
are explicit fallback choices, not silently authorized changes.

### Bounded next implementation

- Change local ratio configuration, downstream planet laws and analytic drive envelope.
- Update reveal/script/camera clocks, duration metadata and native scroll pacing together.
- Add phase-matched source bridge and feature visibility probes in RuntimeWorld.
- Update focused tests/verifiers and README/spec ladder tables in the same change.
- Verify local ratios and phase increments, stage-to-stage cage AND planet slowing,
  forward/reverse/direct seeks, unchanged pre-40.2 behavior, 50% per-stage physical
  viewing travel, actual visible-feature alias bounds, continuous source takeover
  and solid housing. Then build and run same-build/headed browser proof.

This consultation is complete. The proposal has not been implemented or measured
in a new build; the existing preview remains the prior 158 RPM / 100:1 version.
Owner acceptance remains OPEN; no commit, push, deployment or asset regeneration.
