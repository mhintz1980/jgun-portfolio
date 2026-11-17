# HANDOFF — showreel film, Higgsfield batch 1 (2026-11-17)

Session ended early: Mark is changing direction ("calling an audible"). Read this, then ask Mark what the new direction is before doing anything.

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-higgsfield-improvements-d032fb`, branch `jg-041/higgsfield-improvements` (local only, not pushed), created from `jg-041/armament-wiring` @ `70b4a1a2`. A hook blocks writes into the armament worktree, which is why work moved here.

## State
- Review packet for the homepage session: `docs/REVIEW-PACKET-showreel-2026-11-17.md` (findings, numbers, paste prompt).
- Owner rulings confirmed 2026-11-17 and recorded under JG-041 in `TODO.md`: (1) Higgsfield allowed on the film, including shots of Mark's real parts, if geometry stays true; (2) video only: same-type non-protected weapons allowed (AR-15-pattern billet receiver sets, MK18, M249 with custom parts).
- Batch 1 spent 32.07 Higgsfield credits; balance 67.93 (lite plan). Modal $0.
  - Clip A (carbine i2v, Kling 3.0 Turbo): geometry drifted visibly (silhouette IoU 0.59 at end, -6.5 % length/height, camera tilt, magazine/grip/sight/rail redrawn). No markings invented.
  - Clip B (bench plate t2v): not recommended. No dolly; light pool slides 633 px across a still room; granite shimmers; tile seams; clutter; blurred label shapes; has an audio track.
  - Music bed 83 s (ElevenLabs Music v2.5): delivered, no notes from Mark yet.
- Mark chose **real re-render** for a realistic carbine spin (Cycles, same 180 angles). Not run; local $0 vs Modal ~$0.05 not decided; material/lighting look not set.
- Homepage answers: generated spin cannot be scrubbed, keep the existing 180+180 frames; centre-cropping 14.0–40.4 s for phones fails.
- Astra: no ruling on anything.

## Committed vs not
- Committed on this branch: `TODO.md` rulings, the review packet, this handoff, `remotion/scripts/make-clip-seed.py`, `remotion/scripts/geom-compare.py`.
- **Not committed** (Mark's go needed for generated media/frames): `remotion/review/hf-2026-11-17/` (19 MB: clips A and B, music bed, comparison stills, phone-crop sheet). Untracked, local only.
- Not changed: `remotion/src/rules.test.ts` and `remotion/README.md` still forbid AI imagery and any `m249` mention; update both before any generated asset enters the film source. `public/video/showreel-v3.mp4` untouched.

## Scripts
- `python remotion/scripts/make-clip-seed.py <clip_dir> <out.png> [frame]` — line + shade frame onto paper, no text.
- `python remotion/scripts/geom-compare.py <real.png> <frames_dir with start/mid/end.png> <out_dir> <tag>` — registers the real render to each generated frame by silhouette bbox, writes side-by-side, edge overlay (cyan real / red generated), difference, and a JSON report.

## Paste-ready prompt for the next session
```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-higgsfield-improvements-d032fb/docs/HANDOFF-showreel-higgsfield-2026-11-17.md first, then docs/REVIEW-PACKET-showreel-2026-11-17.md in the same worktree (branch jg-041/higgsfield-improvements, local, not pushed).

Mark ended the last session to change direction. First action: ask Mark what the new direction is. Do not resume the carbine re-render or any Higgsfield work until he says so.

Constraints: costs first (Higgsfield balance 67.93 credits; state model, cost and cheapest variant, and get a go per batch). No commits of generated media or frames, no pushes, without Mark's go. Never run npm run render or replace public/video/showreel-v3.mp4. Don't touch src/home/ or proto/. Astra rules on every visual effect. Send images, don't describe them.
```
