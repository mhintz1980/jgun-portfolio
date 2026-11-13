# Homepage arc carousels — 2026-11-07

**Work in progress; production publication authorized 2026-11-12, visual review open.** Mark requested the
21st.dev `kedhareswer/arc-card-carousel` shown in his reference, more images in
every project carousel, documentation updates, and a handoff.

Release preparation on 2026-11-12 ports only the carousel onto clean rebuild
source `7a51bb9d`, preserving the committed header fixes and showreel. The rejected
"Precision Revealed" frame is replaced by the industrial torque wrench frame at
00:12 in committed `public/video/showreel-v3.mp4`, scaled to 1280×720. No unrelated
showcase media or experiments are included. Fresh commit and deployment evidence
will be recorded separately; this preparation note does not claim a completed upload.

The four project rows now use a pinned, scroll-driven arc of cards with an active
image caption. Previous/next controls, arrow keys, card selection and mouse drag
are supported; touch keeps native scrolling. Reduced motion removes easing and
caption animation. Project links remain. Each collection gained three images:
torque wrench 7, Quiet Machine 9, armament 9, renderings 7. Reused showreel
frames are labeled as such. `src/home/content.ts` records image paths and labels;
`ProjectStack.tsx`, `arcMath.ts`, and `arc.css` own the presentation.

The carousel is an adaptation of Kedhareswer Naidu's 21st.dev component: the
public listing describes its license as MIT; its preview informed the wheel
geometry and pinned-track approach. The source was rewritten to fit this site.

Local verification: homepage unit tests passed (83/83), including carousel math
and image-manifest tests. The parent inspected the desktop local page. Independent
GLM review found dropped rapid keypresses and a subsequent focus-loss case; the
implementation was corrected, including the interaction with the homepage focus
handler. Targeted browser checks, including keyboard focus after advancing and
reversing, passed for arc controls on desktop, phone and desktop reduced motion
(3/3, zero page errors). Independent follow-up confirmed rapid forward and reverse
keys, focused wheel scrolling, and reduced motion (4/4). The resize/navigation/focus case passed after its click
was corrected to target the visible clipped monogram (1/1).

The full homepage verifier first timed out after 240 seconds with 13 cases passed
(`output/playwright/home-header-jg043-full/`). The rerun on 2026-11-08 finished all
23 cases PASS with zero browser errors
(`node scripts/verify-home-header.mjs --url=http://localhost:5189/home/ --out=output/playwright/home-header-jg043-full-r2`),
closing the verification gap; it is not owner visual acceptance or deployment
evidence. The earlier
production build passed after the final focus fix in a shared checkout containing unrelated scene changes;
it is not an isolated commit or proof of a future clean release. These checks
are not owner visual acceptance or live deployment evidence.

The November 3 homepage release record remains historical. Production is still
the last separately recorded deployment; consult the current project status for
its identity. Review the new arc, image choices and pacing with Mark, then follow
the owner policy and the repository's isolated-commit and deployment checks if
publication is requested.
