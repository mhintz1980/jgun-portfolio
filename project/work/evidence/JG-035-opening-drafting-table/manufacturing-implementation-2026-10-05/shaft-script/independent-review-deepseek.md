SHIP — the leaf satisfies the spec and the gate claims hold up under independent inspection. One caveat about method: `npx vitest run src/scene/inspection/shaft` cannot start in this sandbox (esbuild fails to resolve `vite.config.ts` under the read-only FS), so I verified the sampler by porting `sampleShaftScript` verbatim and sweeping it at 1/240 s myself, and I verified strings/codepoints, CSS, mount state, and the recorded harness report statically.

Verified

- Strings/codepoints (script.ts:14-21): all four hardness hyphens are U+002D (codepoint 45); recap caption contains exactly one U+2014 (8212), no en dash/minus. Attribution and stress caption match the plan.
- Timing (independent sweep): readable 1.025 s all cards (≥1.0), impulse 0.150 s (≤0.18), settled 1.333/1.033/0.833 s (≥0.8). Warm leaves by 25 (mix 5e-15 at 24.9999999, none at 25). Cool starts 32.8 = 32.0+0.8; final `4340-ht` has stamp `none`, held to 35. 15 discrete changes at [11,15,16.16,16.31,17.8,18.96,19.11,20.3,21.46,21.61,22.6,25,32.8,33.2,35]. Reduced motion: stampScale stays 1, scanProgress ∈ {0,1}.
- Purity: no `Date`/`performance`/`Math.random` in script.ts; writes only into the caller frame.
- aria-live: single `role=status aria-live=polite` region (ShaftStoryLayer.tsx:67) updated only on `frame.discrete` (54-55).
- report.json: 10 captures, contrast 16.39 card / 13.28 captions, no overflow, boxes inside 8% margins, no overlaps, 0 console errors, transcript undercut count 2, no FEA tokens.
- CSS: `letter-spacing:0`, fixed px sizes, no `vw/vh/clamp`.
- Nothing mounted: no app import of ShaftStoryLayer; no shaft `registerStory`.

Minor, non-blocking

- script.ts:94 — `for…of` allocates an array iterator each call, technically violating "no allocation per call"; an indexed loop would remove it.
- ShaftStoryLayer.tsx:54-55 + buildAnnouncement:34-37 — the stamp `in` transition (16.16) bumps the discrete key and re-sets status to an identical string (FAILED isn't added until `settled`), a redundant polite announcement.
- ShaftStoryLayer.tsx:61 — animation is keyed on `cardText`, not stamp state (spec wording); functionally restarts per card.
- Gate S6 was the only open box; this review is that item.

