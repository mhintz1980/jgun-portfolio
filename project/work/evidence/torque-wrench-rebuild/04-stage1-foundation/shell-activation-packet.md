# JG-038 — Stage 1 shell activation packet

Prepared 2026-10-11, 22:39 UTC by the interface reviewer seat (explicit `zai/glm-5.3`, High). This is an exact, unapplied proposal for the shell owner. It is not shared-head, registry, build, browser, GPU, commit, push, PR, deployment, publication, cutover, archive, or cross-chat activation. The parent owns validation and evidence; this GLM review is implementation advisory only and does not close G9 or any other gate.

## Current conclusion

The delivered shell interfaces are present. Stage 1 activation should add `torque-wrench/index.html`, consume the already worker-owned `src/torque-wrench-main.tsx`, and flip the existing private torque row active only after that module and its source gate are present. **No `vite.config.ts` edit is necessary or proposed.** The current config derives Rollup inputs from `PAGES.filter((page) => page.htmlEntry)`; setting `htmlEntry: 'torque-wrench/index.html'` adds the third input automatically while preserving `index.html` and `quiet-machine/index.html`.

At packet preparation, HEAD was `8945fa95cc70b74bdcc9da27cc0573c3d1157da4` on `torque-wrench/rebuild`; the scoped product interface diff was empty, and `torque-wrench/index.html`, `src/torque-wrench-main.tsx`, and `src/scene/torque-wrench/Scene.tsx` were absent. This packet does not review or replace Franklin's worker implementation.

## Exact proposed HTML

Create exactly this file at `torque-wrench/index.html`. The fade sub-block is the byte-for-byte pinned block from `quiet-machine/index.html`; its normalized SHA-256 is `e30f6045d8cfdb71a93e4c8a3af806e9699fa7f13da28720a3f507ce79bfc05b`. Keep LF normalization and the markers intact.

The title/description below are provisional Stage 1 metadata derived from the latest accepted design and its ordered Drafting, Breakthrough, Mechanism, Inspection, and Close chapters. They are not owner social-copy acceptance. No page-specific OG image exists, so this proposal deliberately uses no `og:image`/`twitter:image` rather than reusing the generic site card.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- shell:begin -->
    <!-- shell:fade:begin -->
    <style>
      html { background: #05070a; }
      html[data-fade]::after { content: ""; position: fixed; inset: 0; z-index: 2147483647; background: #05070a; pointer-events: none; }
      html[data-fade="in"]::after { animation: shell-fade-release 600ms ease 4000ms forwards; }
      html[data-fade="out"]::after { animation: shell-fade-out 400ms ease forwards; }
      html[data-fade="release"]::after { animation: shell-fade-release 600ms ease forwards; }
      @keyframes shell-fade-out { from { opacity: 0; } to { opacity: 1; } }
      @keyframes shell-fade-release { from { opacity: 1; } to { opacity: 0; } }
    </style>
    <script>
      try {
        var raw = sessionStorage.getItem('jg:fade')
        sessionStorage.removeItem('jg:fade')
        var age = Date.now() - Number(raw)
        if (raw !== null && isFinite(age) && age >= 0 && age < 5000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.setAttribute('data-fade', 'in')
      } catch (error) {}
    </script>
    <!-- shell:fade:end -->
    <!-- shell:end -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="A private scroll-driven JGun torque wrench rebuild: drafting, breakthrough, mechanism, inspection, and close."
    />
    <meta name="theme-color" content="#05070a" />
    <link rel="canonical" href="https://studiomark.dev/torque-wrench/" />
    <title>JGun Torque Wrench · Private Rebuild</title>
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://studiomark.dev/torque-wrench/" />
    <meta property="og:site_name" content="studiomark.dev" />
    <meta property="og:title" content="JGun Torque Wrench · Private Rebuild" />
    <meta
      property="og:description"
      content="A private scroll-driven JGun torque wrench rebuild: drafting, breakthrough, mechanism, inspection, and close."
    />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="JGun Torque Wrench · Private Rebuild" />
    <meta
      name="twitter:description"
      content="A private scroll-driven JGun torque wrench rebuild: drafting, breakthrough, mechanism, inspection, and close."
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/torque-wrench-main.tsx"></script>
  </body>
</html>
```

## Exact registry and topology proposal

Apply the following product changes only after `src/torque-wrench-main.tsx` exists and the parent-owned source boundary gate passes. The shell owner owns these three protected/shared edits in the coordinated activation window. Franklin continues to own the module and page-local files; do not create or modify the module from this packet.

Two tests contain explicit activation pins even though most topology checks iterate `PAGES`. Both must change with the row. Do not edit `vite.config.ts`.

```diff
diff --git a/src/shared/pages.ts b/src/shared/pages.ts
--- a/src/shared/pages.ts
+++ b/src/shared/pages.ts
@@
-  // Private torque-wrench rebuild (JG-038). Registered but inactive, so the build has no input for
-  // it yet. Activation is one commit that lands the torque HTML entry (with the shared fade block
-  // and a robots noindex meta) and flips this row (reserved: false, href, htmlEntry); see the shell
-  // readiness note, "Delivery into the torque worktree, and activating the private page".
+  // Private torque-wrench rebuild (JG-038). Built and directly reachable, but excluded from public
+  // navigation. The HTML entry carries the pinned shared fade block and robots noindex meta.
   {
     id: 'torque-wrench',
     index: 4,
     label: 'TORQUE WRENCH',
     name: 'JGUN Torque Wrench (private rebuild)',
     path: '/torque-wrench/',
-    href: null,
-    htmlEntry: null,
-    reserved: true,
+    href: '/torque-wrench/',
+    htmlEntry: 'torque-wrench/index.html',
+    reserved: false,
     // Torque structure section 1: navigation to and from this page fades through dark, so the
     // entry carries the shared fade block. The topology tests check the block once it is active.
     fadeIn: true,
diff --git a/src/shared/pages.test.ts b/src/shared/pages.test.ts
--- a/src/shared/pages.test.ts
+++ b/src/shared/pages.test.ts
@@
-  // Activation updates this pin together with the entry list in pageTopology.test.ts: reserved
-  // false, href '/torque-wrench/', htmlEntry 'torque-wrench/index.html'. fadeIn stays true.
-  it('pins the torque-wrench row as private and inactive: no href, no HTML entry, no build input', () => {
+  // Keep this pin synchronized with the entry list in pageTopology.test.ts. The row stays private.
+  it('pins the torque-wrench row as private and active with a real build input', () => {
     expect(byId('torque-wrench')).toMatchObject({
       path: '/torque-wrench/',
-      href: null,
-      htmlEntry: null,
-      reserved: true,
+      href: '/torque-wrench/',
+      htmlEntry: 'torque-wrench/index.html',
+      reserved: false,
       fadeIn: true,
       private: true,
     })
diff --git a/src/shared/pageTopology.test.ts b/src/shared/pageTopology.test.ts
--- a/src/shared/pageTopology.test.ts
+++ b/src/shared/pageTopology.test.ts
@@
-    expect(entries.map((item) => item.entry)).toEqual(['index.html', 'quiet-machine/index.html'])
+    expect(entries.map((item) => item.entry)).toEqual([
+      'index.html',
+      'quiet-machine/index.html',
+      'torque-wrench/index.html',
+    ])
diff --git a/torque-wrench/index.html b/torque-wrench/index.html
new file mode 100644
--- /dev/null
+++ b/torque-wrench/index.html
@@
(use the complete HTML in the preceding section verbatim)
```

No row other than torque-wrench changes. In particular, `m249` remains reserved, and no legacy redirect targets the private page.

## Ownership and activation prerequisites

1. Franklin delivers `src/torque-wrench-main.tsx`, the page-local Stage 1 files, and the source-gate shape: the entry reaches `cadGate.ts`, and the only dynamic narrative import is `cadGate -> './Scene'`. The current Stage 1 worker state is honest non-narrative work: no narrative Canvas or CAD acceptance is claimed here.
2. The parent runs the source-only boundary gate and confirms it passes without browser, build, GPU, or file writes.
3. The shell owner and parent coordinate a shared-file activation window. The shell owner adds the exact HTML and applies only the registry/test changes above; it does not edit Franklin's module, Vite config, root runtime, V16, or another page's head.
4. Activation keeps `private: true` and `fadeIn: true`. `publicPages()` therefore continues to exclude torque from every `PageNav` variant, so this does not add public navigation, cutover, or publication.
5. Existing inputs remain untouched because Vite reads them from `PAGES`. No MPA fallback or Vite mode change is needed; `appType: 'mpa'` is already configured.

## Parent-owned validation sequence

Recheck resource ownership before the build. Do not launch a preview, browser, capture, or GPU work from this packet. The activation packet itself requires only the CPU/source/build checks below; runtime transition behavior remains G0 evidence, not a claim made by activation.

```powershell
npx vitest run src/shared
npx tsc --noEmit
node scripts/check-torque-stage1-boundary.mjs
npx vite build --outDir .scratch/stage1-shell-activation/dist
Test-Path .scratch/stage1-shell-activation/dist/torque-wrench/index.html
Select-String -Path .scratch/stage1-shell-activation/dist/torque-wrench/index.html -Pattern 'name="robots"','/src/torque-wrench-main.tsx','shell:fade:begin'
```

Required interpretation:

- Shared tests must include the activated noindex check, pinned fade hash, module existence, and the three-entry Vite input identity.
- Typecheck and the source gate must pass on the named activation tree.
- The scratch build must emit `dist/torque-wrench/index.html` while preserving `dist/index.html` and `dist/quiet-machine/index.html`; repository `dist/` remains untouched.
- A later preview/browser roster is parent-owned after a fresh resource check. Stage 0's Quiet Machine transition pass does not prove the torque entry, and no failure, poster, runtime, visual, or hardware-GL pass follows from this packet.

## Interface traps

- The hard-coded pins in `pages.test.ts` and `pageTopology.test.ts` both need the activation edit. Registry iteration alone does not make every expectation update itself.
- Do not add the root redirect block. Only `index.html` carries the legacy redirect block; the torque head needs the fade sub-block only.
- The fade sub-block is byte-pinned. Copy it exactly, including comments, the reduced-motion check, and the 4000ms safety delay; do not reformat it.
- `noindex` must be a real head meta, not an HTML comment or body tag. `noindex, nofollow` is intentional for a private direct-link rebuild.
- `private: true` is the public-nav exclusion mechanism. Flipping only `reserved:false` while losing `private:true` would expose an unauthorized nav row.
- The private module is a dependency, not a shell-owner write. The HTML script path is exactly `/src/torque-wrench-main.tsx`.
- Current Stage 1 has no narrative Canvas/CAD result. Static presentation and source isolation are not final poster, WebGL-failure, runtime, visual, or performance acceptance.
- `releaseFadeWhen` has bounded polling and no cancellation handle. That is a future page lifecycle concern for remount/short-lived mount proof, not a reason to alter the pinned head or shared fade code during activation.
- Provisional title/description and omitted social image do not constitute owner metadata approval. If Mark supplies final private-page copy or art, the shell owner should update only the non-shell metadata in a coordinated follow-up.

## Rollback ownership

- Before coordinated delivery, any failed review leaves this packet unused; no product rollback exists because no activation is performed.
- If validation fails after the shell owner's patch, the shell owner reverts only its exact activation hunks and/or removes its new `torque-wrench/index.html`. It must not reset, clean, or revert Franklin's module/page-local files, existing dirty work, V16, or unrelated evidence.
- Safest build-failure deactivation order is to return the registry row to `reserved: true` with null `href`/`htmlEntry` and restore both test pins first, removing the input, then remove the shell-owned HTML if needed. The worker module remains Franklin's surface for repair.
- If the delivered activation later needs rollback, the shell owner owns registry/test/HTML reversal, Franklin owns page-local/module repair, and the parent reruns the scoped checks and records the failure and release. No broad checkout reset is authorized.

## Source provenance

Product interface files were read at HEAD `8945fa95cc70b74bdcc9da27cc0573c3d1157da4`; `git diff --quiet -- src/shared/pages.ts src/shared/pageTopology.test.ts vite.config.ts quiet-machine/index.html` was empty at preparation. Untracked Stage 1 evidence is identified as such below.

| File | SHA-256 at preparation |
| --- | --- |
| `src/shared/pages.ts` | `8de3a3715ada82c01b4ae89e600ad649c7b254563a2f5ac3f33658007f185581` |
| `src/shared/pageFade.ts` | `da86f1b2488999d486d5f306e399dab940a35688ae027e0b232eac42439e453c` |
| `src/shared/PageNav.tsx` | `83009d0be82e19c3edb4d49e6b59357ddd9f39f20045322cf0f5015f9288c049` |
| `src/shared/poster.ts` | `304d4265cbc7b633f915fd7051e7dc16c81476d23a5c916db879ddd20f339b79` |
| `src/shared/PosterImage.tsx` | `7ebfd4ca8b7b2c1863c5baf9ba44a0db83204804b4419bcf91d7be5cb65d7fa7` |
| `src/shared/pageTopology.test.ts` | `f8ede06dba653ae48c3e6c4ddbcf17066eea44b3dd5eea30a519a05af86360e6` |
| `src/shared/pages.test.ts` | `5950c1f7754f1a76102b499526243d0284b27683c399cb7f56414a01ece59121` |
| `vite.config.ts` | `887896de4d3b287da3c90988b807bb27892b8dccf3a5235aeddd1153bda59157` |
| `quiet-machine/index.html` | `99099c847064c3c9b193c3dd969e73783628810656ab5c3cc95369ae3925a54e` |
| `src/quiet-machine-main.tsx` | `c841f8faed9794bb4a1df8f0e9ed54dcbf5c2b3acb16f8af34f94dde140cda53` |
| Stage 1 parent README (untracked) | `3d58883c1eba5b3ad5150b41f2601b6746ed1cd05f4ec7ef71a7a7344cf83bc2` |
| `scripts/check-torque-stage1-boundary.mjs` (untracked) | `d3298bd7a4a260967be32a1b82c2ab17929e42aaae6f19da019bbbf83fef1f52` |

Planning/evidence hashes retained for provenance: implementation plan `e9b84642f6a06ebd290081b2f3bce9ce9d6893f8ecb5e527af6ed4ff3ba82900`; structure `edf3af2fe609b203525fb342932f90664c15d280e29fb1b31f24eda4e6112f24`; design `62e0c3498f308ee64fededcad2723e07919afaf84b560f8a9166af84c570845b`; verification contract `acb1f122252a32b045240af21e8760cb54e6473de3763b0b04dc568343989d59`; Stage 0 README `cd51efbf7c3d25f395d84238ebf73344b50b9ff39c906bbc276e16596916c5f5`; shell source delivery report `89d6cb7e9ec0796282377c3bbd5aa8d94fdf507676ea0f3c4a7f93c03f0382bd`.

## Exact dependencies and status

- Delivered shared registry/fade/navigation/poster interfaces: present from Stage 0.
- Private HTML entry: absent; exact proposal above.
- Private module path: `src/torque-wrench-main.tsx`; absent at packet preparation and owned by Franklin.
- Stage 1 source boundary gate script: present as an untracked parent/worker gate.
- Registry activation and the two test pins: proposed only.
- Vite config edit: none required.
- Public navigation/cutover/publication: none proposed.
- G0–G9, including private runtime topology, failure behavior, final posters, performance, Astra review, and owner visual/motion acceptance: all remain open.
