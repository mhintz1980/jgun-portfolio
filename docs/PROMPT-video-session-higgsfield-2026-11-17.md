# Prompt for the video session: Higgsfield on the showreel (2026-11-17)

Written by the homepage session (worktree `homepage-prototype-approval-b6962a`) at Mark's
request. Paste the block below into a new session. It covers the VIDEO only.

```
You are working on the studiomark.dev showreel film only (JG-041, "The Line"). Do not touch
the homepage code (src/home/, proto/). A separate homepage session reviews what you produce.

Start here, in this order:
1. Worktree C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\armament-wiring-clipspin-15a80d
   (branch jg-041/armament-wiring, last known HEAD 70b4a1a2). Confirm with git log that this is
   still the newest film work before you change anything; if a newer film branch exists, say so
   and ask Mark which one to use.
2. Read AGENTS.md, the JG-041 entry in TODO.md, remotion/README.md, the newest docs/HANDOFF-*
   for the armament lane, and
   C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\.claude\worktrees\jg-041-spin-shot-review-12f814\docs\ANSWERS-homepage-armament-frames-2026-11-16.md
3. Read the Higgsfield skill: C:/Projects/skills-master/local/higgsfield-video/SKILL.md.
   Credentials are in the jgun-portfolio .env.local. C:/Projects/OpenMontage has a Higgsfield
   tool and image/upscale helpers; its model list is stale, so check it against the live API.

Goal: improve the film as it sits now, using Higgsfield where it helps:
- the armament section (it keeps the rotation of the weapon),
- realism (lighting, materials, environment, atmosphere),
- camera movement,
- audio.

Owner direction from Mark, 2026-11-17 (confirm each with him in one line at the start, then
record it in TODO.md as superseding the older ruling it changes):
- Higgsfield may be used on the film, including on shots that show his real parts.
- The armament section may show weapons of the same type and style as his work that are not
  his protected designs: billet receiver sets on the AR-15 pattern and the MK18, and the M249
  with custom parts. His reason: it is video, no model is shared, and nobody can take
  measurements or dimensions from it. This changes the 2026-11-04 M249 ruling for VIDEO only.

Geometry rule (the main constraint):
- Mark's actual parts must stay true to their real geometry. A negligible deviation from
  diffusion is acceptable. Anything a viewer could notice is not.
- For every generated shot that shows one of his real parts, compare it against the real
  render at matched moments (start, middle, end at least): side-by-side stills plus an edge
  or difference overlay. Report what moved: silhouette, hole and tooth counts, proportions,
  invented or missing features, invented markings.
- Flag anything noticeable to Mark with the still. Do not decide for him that it is fine.
- Prefer image-to-video seeded from his own renders (start frame, and end frame where the
  model supports it) over text-to-video for anything that shows his parts. Where geometry
  matters most, keep the real render and use Higgsfield for the surroundings instead.

Seed images and labels:
- Seed from Mark's own renders and photos. Do not seed from other makers' product photos
  without asking him first; they carry those makers' designs and markings.
- No brand names, logos or roll marks, in the picture or in copy. Pattern or designation
  only (AR-15 pattern, MK18, M249). Check generated frames for invented markings.
- Anything that is not Mark's own design keeps the representative label the rules test
  requires. Never reuse or revive "Precision Revealed".
- Still banned: m249-transformed.glb and m249_FN.glb; dimensions, GD&T and part numbers on
  screen; committing models.

Spend and approvals:
- Before any Higgsfield or Modal run: state the cost in credits or dollars, the model, and the
  cheapest variant, in the first line, and wait for Mark's go for that batch. An earlier go
  does not cover a later batch. Report the balance before and after.
- No commits of frames or models, and no pushes, without Mark's go.
- Astra (gpt-6-astra on the codex surface) rules on every visual effect before it is called done.
- Do not replace public/video/showreel-v3.mp4. The homepage plays that file; it changes only
  after Mark accepts a cut.

What the homepage session needs back from you (write it as
docs/REVIEW-PACKET-showreel-<date>.md in your worktree, with absolute paths):
1. The review MP4 and stills for each changed shot (remotion/review/), with the geometry
   comparison stills beside them.
2. For the weapon rotation: say whether the homepage can scrub it. The homepage needs a
   numbered frame set with even angles, one fixed crop for the whole spin, a clean loop, and
   ideally a matched line layer and shaded layer that register with each other. If a
   generated spin cannot give that, say so plainly; the homepage will keep the existing
   carbine frames (180 line + 180 shade, 2 degrees apart).
3. The film passage and timecodes that suit the homepage opening lens (it currently plays
   14.0 s to 40.4 s of showreel-v3.mp4), and whether the frame works cropped to a tall phone
   screen; today the film's own caption text is cut off at phone width.
4. What you spent, what Mark approved, what Astra ruled, and what is still open.
5. A ready-to-paste prompt for the homepage session.

Show Mark stills early and often. He rules by looking.
```

## Notes for the homepage session

- The M249 and Higgsfield directions above are Mark's words from this session on
  2026-11-17 ("I'm thinking I want to give them the go ahead"); the prompt asks the video
  session to confirm them with him before recording them.
- The homepage armament stage is built to scrub a numbered frame set, so the source can be
  swapped if the video session delivers a better one.
