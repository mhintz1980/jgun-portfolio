import re, os, subprocess, json
W = r'C:\Users\Markimus\.codex\worktrees\cleanup-2026-11-05\jgun-torque-wrench'
S = r'C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench'
os.chdir(W)
CTX = os.path.join(W, 'project', 'context')
def rd(p):
    b = open(p, 'rb').read().decode('utf-8')
    return ('\r\n' in b), b.replace('\r\n', '\n')
def wr(p, t, crlf):
    open(p, 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8'))
LINK = re.compile(r'(\]\()([^)\s]+)((?:\s+"[^"]*")?\))')
def rewrite(line, origin_dir, new_dir):
    def f(m):
        t = m.group(2)
        if re.match(r'^(https?:|mailto:|#|/)', t):
            return m.group(0)
        path, _, anc = t.partition('#')
        if not path:
            return m.group(0)
        ab = os.path.normpath(os.path.join(origin_dir, path))
        rel = os.path.relpath(ab, new_dir).replace('\\', '/')
        return m.group(1) + rel + ('#' + anc if anc else '') + m.group(3)
    return LINK.sub(f, line)

# ---------- extract banners ----------
crlf_todo, todo = rd('TODO.md')
crlf_rd, readme = rd(os.path.join('project', 'README.md'))
crlf_ix, index = rd(os.path.join('project', 'work', 'INDEX.md'))
old_todo, old_readme, old_index = todo, readme, index
tl = todo.split('\n')
rl = readme.split('\n')
assert tl[0].startswith('# TODO')
t_region = tl[1:47]  # lines 2..47
t_ban = [(i + 2, l) for i, l in enumerate(t_region) if l.strip()]
assert all(l.startswith('> ') for _, l in t_ban), 'non-banner in TODO region'
assert tl[47].strip() == '' and tl[48].startswith('> **Canonical approved task queue')
assert len(t_ban) == 31, len(t_ban)
assert rl[0].startswith('# Project Knowledge Map')
r_region = rl[1:37]
r_ban = [(i + 2, l) for i, l in enumerate(r_region) if l.strip()]
assert all(l.startswith('> ') for _, l in r_ban), 'non-banner in README region'
assert len(r_ban) == 24, len(r_ban)

# ---------- history record ----------
H = []
H.append('# Status history — banners moved out of TODO.md and project/README.md (2026-11-05)')
H.append('')
H.append('Historical record created by JG-041 batch B1. Every dated status banner that previously sat at the top of [TODO.md](../../TODO.md) (31) and [project/README.md](../README.md) (24) is preserved below with its original text, dates and source provenance. Only relative link targets were rewritten so they resolve from this file; nothing was reworded. The current state lives in [current-status-2026-11-05.md](current-status-2026-11-05.md) and the owner policy in [evolving portfolio and visual review](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md).')
H.append('')
H.append('Reading guide: entries are newest-first, as they appeared in the sources. Earlier banners describe the state of their own date; they are not current delivery vetoes (owner policy 2026-10-31) and do not record acceptance beyond what their text states. The 2026-11-03 JG-039 and 2026-10-31 two-page publication banners are superseded as the latest release by the JG-040 Stage 3 release of 2026-11-04 (deployment e796fe69, source f83f4ba3); see the current-status record. Wording such as "Stage 2 not started" or "unpushed" in older entries is preserved as history.')
H.append('')
H.append('Provenance: the TODO.md and README.md line numbers below refer to the files as they stood in the JG-041 worktree before B1 (branch codex/cleanup-2026-11-05, baseline 0b284226 plus the JG-041 intake edit). Git history of both files holds the earlier states.')
H.append('')
H.append('## A. Banners from TODO.md (31)')
H.append('')
for n, (ln, l) in enumerate(t_ban, 1):
    H.append('### T-%02d — TODO.md line %d' % (n, ln))
    H.append('')
    H.append(rewrite(l, W, CTX))
    H.append('')
H.append('## B. Banners from project/README.md (24)')
H.append('')
for n, (ln, l) in enumerate(r_ban, 1):
    H.append('### R-%02d — project/README.md line %d' % (n, ln))
    H.append('')
    H.append(rewrite(l, os.path.join(W, 'project'), CTX))
    H.append('')
hist = '\n'.join(H)
wr(os.path.join(CTX, 'status-history-2026-11-05.md'), hist, False)

# ---------- TODO.md restructure ----------
head = [
 tl[0],
 '',
 '> **Current owner policy:** [evolving portfolio and visual review](project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) governs publication, HUD priorities and evidence boundaries.',
 '',
 '> **Current status:** [current-status-2026-11-05](project/context/current-status-2026-11-05.md) (release identity, active lanes, open gates, next actions). Dated banners that used to sit here are preserved in [status history](project/context/status-history-2026-11-05.md).',
 '',
]
rest = tl[48:]
todo = '\n'.join(head + rest)
# move trailing unchecked JG-035 handoff task into Active
tail_task_idx = None
lines = todo.split('\n')
for i in range(len(lines) - 1, -1, -1):
    if lines[i].startswith('- [ ] **JG-035 handoff (2026-10-08):**'):
        tail_task_idx = i
        break
assert tail_task_idx is not None
task = lines.pop(tail_task_idx)
while lines and lines[-1].strip() == '':
    lines.pop()
lines.append('')
qi = lines.index('## Queued')
k = qi - 1
while lines[k].strip() == '':
    k -= 1
lines[k + 1:k + 1] = ['', task]
todo = '\n'.join(lines)

# JG-040 + JG-041 refresh
old = '**Open: owner visual acceptance of the Stage 2 additions, two parked polish notes, push/deploy.** Committed `009aa4ae`'.replace('`', chr(96))
assert old in todo
todo = todo.replace(old, old + ' *(History note 2026-11-05: Stage 2 was not accepted as a whole on 2026-11-04 and the push/deploy step was carried out by the Stage 3 release below; original text preserved.)*', 1)
anchor = 'Live still runs 81b234d0 with the rejected leader.'
assert anchor in todo
stage3 = anchor + '\n\n **2026-11-04 Stage 3 built, approved by Mark for release and published:** deployment `e796fe69` (Cloudflare Pages direct upload, rollback `81b234d0`) from source `f83f4ba3` on `origin/torque-wrench/rebuild`; [release evidence](project/work/evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md) records isolated typecheck, 128 files / 1,507 tests, 36/36 verifier tests, build and asset gate, live 68/68 HUD checks and 9/9 publication smoke. **Open: owner visual acceptance of Stage 3** (release approval is not recorded as final visual acceptance), plus the strict cinematic/alias/opening follow-ups from evidence 73. 2026-11-05: the HUD copy deck was approved ([00-owner-rulings](docs/torque-wrench-rebuild/00-owner-rulings.md)); post-release tracker commits and the phone-framing follow-up below are later state with no later release record. See [current status](project/context/current-status-2026-11-05.md).'.replace('`', chr(96))
todo = todo.replace(anchor, stage3, 1)
j41 = 'concurrent HUD/tracker, logo and showreel lanes in the shared checkout remain untouched and out of scope.'
assert j41 in todo
todo = todo.replace(j41, j41 + ' **B1 (status/navigation cleanup) executed in the worktree 2026-11-05:** banners moved to [status history](project/context/status-history-2026-11-05.md), [current status](project/context/current-status-2026-11-05.md) added, [B1 report](project/work/evidence/JG-041-maintenance-cleanup/b1-docs/report.md); pending parent review and integration.', 1)
wr('TODO.md', todo, crlf_todo)

# ---------- README ----------
rhead = [
 rl[0],
 '> **Current status:** [current-status-2026-11-05](context/current-status-2026-11-05.md) · **Owner policy:** [evolving portfolio and visual review](context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) · Dated banners that used to sit here are preserved in [status history](context/status-history-2026-11-05.md) (JG-041 B1, 2026-11-05).',
]
readme = '\n'.join(rhead + rl[37:])
wr(os.path.join('project', 'README.md'), readme, crlf_rd)

# ---------- INDEX ----------
def sub1(s, a, b):
    assert a in s, a[:60]
    return s.replace(a, b, 1)
m = re.search(r'\| JG-040 \| (\*\*Stage 1 built.*?\*\*) Owner chose (.*?) \| Production HUD', index)
assert m
ruling = re.search(r'\(ruling: (\[.*?\]\(.*?\))\)', index).group(1)
new40 = ('**Stage 1 accepted 2026-11-03; Stage 2 executed 2026-11-03 but not accepted as a whole in the 2026-11-04 live review (early chrome, rail overlap, FOS bar thickness, leader rejected); Stage 3 corrections built and released 2026-11-04 (deployment `e796fe69`, source `f83f4ba3`). Owner visual acceptance of Stage 3 and the 2026-11-05 narrow/phone cascade-framing follow-up are open (framing deferred); HUD copy deck approved 2026-11-05.** Owner chose HUD concept D + inline technical content (ruling: ' + ruling + ').').replace('`', chr(96))
index = index.replace(m.group(0), '| JG-040 | ' + new40 + ' | Production HUD', 1)
index = sub1(index, '[evidence](evidence/JG-040-hud-d-inline/README.md) | Pending |', '[evidence](evidence/JG-040-hud-d-inline/README.md) · [Stage 3 release](evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md) | Stage 3 released; owner acceptance open |')
index = sub1(index, 'Broader cinematic acceptance remains open. |', 'Broader cinematic acceptance remains open. The 2026-11-04 JG-040 Stage 3 release left the homepage HTML identical to this deployment. |')
index = sub1(index, ' | Post-deployment maintenance cleanup |', ' B1 docs cleanup executed in the worktree 2026-11-05 ([report](evidence/JG-041-maintenance-cleanup/b1-docs/report.md)); pending parent review. | Post-deployment maintenance cleanup |')
wr(os.path.join('project', 'work', 'INDEX.md'), index, crlf_ix)

# ---------- current status ----------
def git(*a, cwd=W):
    return subprocess.run(['git'] + list(a), cwd=cwd, capture_output=True, text=True).stdout.strip()
anc = subprocess.run(['git', 'merge-base', '--is-ancestor', 'f83f4ba3', '235f6fc4'], cwd=W).returncode
cur = '''# Current status — 2026-11-05

Concise record maintained under JG-041 B1. It points to evidence instead of copying test rosters. Older dated banners: [status history](status-history-2026-11-05.md). Queue: [TODO.md](../../TODO.md). Registry: [INDEX.md](../work/INDEX.md). Owner policy: [evolving portfolio and visual review](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md) (publish useful work in progress, HUD provisional, keep models central).

## Release identity (what is deployed)

- **Latest release:** JG-040 Stage 3, approved by Mark and published 2026-11-04. Cloudflare Pages project jgun-portfolio (direct upload), production deployment e796fe69-b95b-4de9-93b1-cdfd2844b343, built from source f83f4ba3c380ee93da105ea0d102d3bc08cc5a31 on origin/torque-wrench/rebuild. Rollback deployment 81b234d0. Evidence: [release-2026-11-04.md](../work/evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md); Stage 3 review packet: [README](../work/evidence/JG-040-hud-d-inline/README.md).
- **Public pages served:** /home/ (JG-039 homepage, deployment 2b33b2f4 from 876f11fc on 2026-11-03; [release evidence](../work/evidence/JG-039-homepage/release-2026-11-03.md)), /torque-wrench/ (Stage 3 HUD), /quiet-machine/. The root forwards to /home/; the private armament page keeps its visibility policy and redactions.
- **Later, not released:** commits after the release, including the torque-path tracker work (235f6fc4) and the 2026-11-05 phone-framing note (0b284226, the JG-041 baseline), have no release record after e796fe69.

## Active lanes

| Lane | State | Pointers |
|---|---|---|
| JG-040 HUD follow-ups | Stage 3 released. 2026-11-05: HUD copy deck approved and facts confirmed ([rulings](../../docs/torque-wrench-rebuild/00-owner-rulings.md)). Narrow/phone camera framing during the Inspection cascade (about .806-.825) is a deferred follow-up; try a small camera-angle shift first. | [plan](../work/plans/JG-040-hud-d-inline.md), [tracker captures 2026-11-05](../work/evidence/JG-040-hud-d-inline/torque-tracker-2026-11-05/v2/) (untracked in the shared checkout at the time of writing) |
| JG-041 cleanup | B0-B3 first pass on codex/cleanup-2026-11-05; B1 (this documentation cleanup) executed. B4 legacy-root retirement is a separate later milestone. | [plan](../work/plans/JG-041-maintenance-cleanup.md), [evidence](../work/evidence/JG-041-maintenance-cleanup/README.md) |
| studiomark logo / bumper | Work in the shared checkout: studiomark-logo scene edits and bumper video concepts (Storm Ignition and Low Puddle Crane-Up selected, two others parked); not part of any release. | BUMPER-CONCEPTS-2026-11-05.md under work/evidence/studiomark-logo/ (untracked in the shared checkout) |
| Showreel | Showreel artifacts exist in the shared checkout (remotion/src/Showreel.tsx, public/video/showreel-v3.mp4). Status is not recorded in the queue; owned by another lane. | none yet |

## Open gates

- Owner visual acceptance of the Stage 3 HUD (release approval is recorded; final visual acceptance is not).
- Evidence 73 FAIL/deferred results (strict framing/HUD gates, alias residuals, opening semantic proof, independent final review) stay open follow-ups, not publication blockers under the owner policy.
- JG-038 gates G0-G9, and the unchecked JG-032 to JG-037 owner reviews, remain as listed in TODO.md.
- Pending owner confirmation: the FEA drafting-note idea (ruling of 2026-11-05) is not to be implemented until Mark confirms.

## Next actions

1. Owner review of the Stage 3 live HUD; then decide on the deferred phone-framing follow-up.
2. Continue visual concepts with Mark, models central; show high-speed readability issues first.
3. Finish JG-041 B1 review, then B2 (tooling reproducibility) and B3 (storage manifests) per the plan; no deployment from the cleanup branch.
4. Update this file and the INDEX row with each future release instead of adding banners to TODO.md or project/README.md.
'''
wr(os.path.join(CTX, 'current-status-2026-11-05.md'), cur, False)

# ---------- link check ----------
def slug(h):
    s = re.sub(r'[^a-z0-9 \-]', '', h.strip().lower())
    return s.replace(' ', '-')
def check(text, origin_dir):
    broken, shared_only, n = [], [], 0
    for m in LINK.finditer(text):
        t = m.group(2)
        if re.match(r'^(https?:|mailto:)', t):
            continue
        n += 1
        path, _, a = t.partition('#')
        ab = os.path.normpath(os.path.join(origin_dir, path)) if path else None
        if ab is not None and not os.path.exists(ab):
            rel = os.path.relpath(ab, W)
            if os.path.exists(os.path.join(S, rel)):
                shared_only.append(rel)
            else:
                broken.append(rel)
            continue
        if a and ab is not None and ab.endswith('.md') and os.path.isfile(ab):
            heads = [slug(h.lstrip('#')) for h in open(ab, encoding='utf-8').read().split('\n') if h.startswith('#')]
            if a not in heads:
                broken.append(os.path.relpath(ab, W) + '#' + a)
    return n, sorted(set(broken)), sorted(set(shared_only))
files = {
 'TODO.md': (W, 'TODO.md'),
 'project/README.md': (os.path.join(W, 'project'), 'project/README.md'),
 'project/work/INDEX.md': (os.path.join(W, 'project', 'work'), 'project/work/INDEX.md'),
 'project/context/status-history-2026-11-05.md': (CTX, 'project/context/status-history-2026-11-05.md'),
 'project/context/current-status-2026-11-05.md': (CTX, 'project/context/current-status-2026-11-05.md'),
}
oldtexts = {'TODO.md': old_todo, 'project/README.md': old_readme, 'project/work/INDEX.md': old_index}
old_broken = set()
for k, t in oldtexts.items():
    _, b, _ = check(t, files[k][0])
    old_broken |= set(b)
res = {}
for k, (od, _) in files.items():
    txt = rd(os.path.join(W, k))[1]
    res[k] = check(txt, od)
newly = sorted({b for k in res for b in res[k][1]} - old_broken)
cnt = {'todo_in': len(t_ban), 'readme_in': len(r_ban)}
tdo_after = len([l for l in todo.split('\n') if l.startswith('> ')])
rd_after = len([l for l in readme.split('\n') if l.startswith('> ')])
rep = []
rep.append('# JG-041 B1 — status/navigation documentation cleanup report (2026-11-05)')
rep.append('')
rep.append('Worktree: codex/cleanup-2026-11-05. Prose-only change; no builds or browsers run; no commits. Generated and verified by [restructure.py](restructure.py) (re-runnable only on the pre-B1 files; it asserts the banner counts).')
rep.append('')
rep.append('## What moved where')
rep.append('')
rep.append('| File | Dated banners before | Moved to history | Blockquote lines after |')
rep.append('|---|---|---|---|')
rep.append('| TODO.md | 31 (plus 1 non-dated queue rule) | 31 | %d (2 pointer banners + the queue rule) |' % tdo_after)
rep.append('| project/README.md | 24 (plus 1 rule) | 24 | %d (1 pointer banner + the work-ID rule) |' % rd_after)
rep.append('')
rep.append('- New history record [status-history-2026-11-05.md](../../../../context/status-history-2026-11-05.md): 55 banners verbatim (T-01..T-31, R-01..R-24) with source file and original line number. Only relative link targets were rewritten (repo-root-relative from TODO.md, project-relative from README.md) by resolving each against its original directory and re-relativizing to project/context/.')
rep.append('- New current-status record [current-status-2026-11-05.md](../../../../context/current-status-2026-11-05.md).')
rep.append('- TODO.md order is now: title, two pointer banners, queue rule + start paragraph, Active, Queued, Task Intake, Verified Legacy Work, Operating Constraints. No queue was reordered. The one unchecked task stranded after Operating Constraints (JG-035 handoff 2026-10-08, text unchanged) was moved to the end of Active; no task was deleted.')
rep.append('- INDEX.md rows JG-039, JG-040, JG-041 updated; all other rows untouched.')
rep.append('- Anchor search (git grep of TODO/README anchors): only TODO.md#active and TODO.md#queued are referenced elsewhere (INDEX, plans); both headings still exist. No banner anchors were referenced, so no redirects were needed.')
rep.append('')
rep.append('## Reconciliation decisions')
rep.append('')
rep.append('- JG-040 Stage 3 release: deployment e796fe69, source f83f4ba3, rollback 81b234d0, from [release-2026-11-04.md](../../JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md). The earlier TODO entry text ("Open: ... push/deploy", 009aa4ae unpushed) was preserved with a dated history note and a new Stage 3 paragraph, not deleted.')
rep.append('- Stage 2 status: INDEX said Stage 2 not started; owner rulings of 2026-11-03/04 in docs/torque-wrench-rebuild/00-owner-rulings.md record Stage 2 executed, then not accepted as a whole on 2026-11-04. INDEX now says so.')
rep.append('- Owner visual acceptance of Stage 3 is recorded as OPEN (the release evidence records Mark approving the corrections for release, not a final visual acceptance); nothing was marked accepted.')
rep.append('- 2026-11-05: HUD copy deck approval (rulings file) and the narrow/phone framing follow-up (TODO Active, untracked tracker evidence read only in the shared checkout) are listed as later state. The follow-up item stays unchecked and deferred.')
rep.append('- JG-039: row keeps its published-2026-11-03 status; added that the Stage 3 release left the homepage HTML identical (release evidence, Preserved boundaries).')
rep.append('- Post-release commits: git merge-base --is-ancestor f83f4ba3 235f6fc4 exit code %d (0 means the tracker commit follows the release). No release record exists after e796fe69, so they are described as not released.' % anc)
rep.append('- studiomark logo/bumper and showreel lanes are described only from observed shared-checkout artifacts (modified src/scene/studiomark-logo files, BUMPER-CONCEPTS-2026-11-05.md, remotion/src/Showreel.tsx, public/video files); their status is not otherwise recorded, so the record says so.')
rep.append('')
rep.append('## Link check')
rep.append('')
rep.append('Method: regex extraction of every markdown link target in each touched or created file; non-http targets resolved against the file directory and tested with os.path.exists; #anchor targets checked against markdown headings of the target file. Links that miss in the worktree but exist in the shared checkout (untracked evidence not yet integrated) are listed separately. Broken sets for the pre-B1 TODO/README/INDEX were computed the same way to separate pre-existing breakage from new breakage.')
rep.append('')
rep.append('| File | Local links checked | Broken | Resolve only in shared checkout |')
rep.append('|---|---|---|---|')
for k, (n, b, s) in res.items():
    rep.append('| %s | %d | %d | %d |' % (k, n, len(b), len(s)))
rep.append('')
rep.append('Newly broken links versus the pre-B1 files: %d.' % len(newly))
for x in newly:
    rep.append('- NEW BROKEN: ' + x)
allb = sorted({b for k in res for b in res[k][1]})
if allb:
    rep.append('')
    rep.append('Broken targets present after B1 (all also present before B1 unless listed above):')
    for x in allb:
        rep.append('- ' + x)
alls = sorted({b for k in res for b in res[k][2]})
if alls:
    rep.append('')
    rep.append('Resolve only in the shared checkout (untracked there, will resolve after those lanes integrate):')
    for x in alls:
        rep.append('- ' + x)
rep.append('')
rep.append('## Intentionally left in place')
rep.append('')
rep.append('- Long per-task narrative sub-bullets under Active and Queued (JG-033, JG-035, JG-038 and others) stay in TODO.md; moving them would change task records, and the plan limits B1 to the dated banners. Candidate for a later pass.')
rep.append('- Root README.md and deployment status docs were not touched.')
rep.append('- Section 5 of the plan names "TODO.md ~86 KB"; Active/Queued bulk remains, so TODO.md shrinks by the banner volume only (see git diff --stat).')
open(os.path.join(W, 'project', 'work', 'evidence', 'JG-041-maintenance-cleanup', 'b1-docs', 'report.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(rep) + '\n')
print(json.dumps({k: [v[0], v[1], v[2]] for k, v in res.items()}, indent=1)[:3000])
print('newly', newly, 'anc', anc, 'todo_after', tdo_after, 'readme_after', rd_after)

