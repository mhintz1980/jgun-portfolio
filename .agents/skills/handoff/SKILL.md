---
name: handoff
description: "Write a repo handoff document plus a ready-to-paste next-session prompt for jgun-portfolio. Use when pausing or ending a session, switching agents, or when Mark says 'handoff'. NOT for vault closeout with ledger triage and commits (that is wrap)."
tags: [session, docs]
---

# handoff (jgun-portfolio)

Canonical copy for every agent in this repo (Claude Code, Codex, others). The Claude
stub at `.claude/skills/handoff/SKILL.md` points here.

**Provenance.** Adapted from `C:/Projects/skills-master/local/handoff/SKILL.md`
(rules: reference artifacts by path, redact secrets, "suggested skills" section) and
the `/pickup` pairing in `C:/Projects/skills-master/vendor/caneff-agent-skills/`.
Changed: those write to the OS temp dir; this repo's rule (AGENTS.md "Handoff delivery
preference") needs a saved doc in the repo and a pasteable prompt.

## Steps

1. `git status --short` and `git log --oneline -5`. List anything uncommitted that this
   session did NOT touch and ask before including it. Stage by explicit path only,
   never `git add -A` or `git add .`.
2. If code changed, run `npm run check` and record the real result. Report failures
   as failures; never write "green" without having run it.
3. Write `docs/HANDOFF-<slug>-<YYYY-MM-DD>[a-z].md` with: Done (with commit SHAs),
   In progress, Next action (one exact step), Known bugs/deferred FAILs, Approval
   state and boundaries (what Mark has and has not authorized), Suggested skills,
   Absolute workspace path and branch. Reference plans/specs/commits by path; do not
   duplicate them. Redact keys, passwords and personal data.
4. Put the **ready-to-paste prompt** in the final response AND save it at the bottom of
   the handoff. It must contain: absolute handoff path, intended workspace, exact next
   action, boundaries/approval state. Do not imply authorization beyond what Mark gave.
5. Commit the handoff with `git commit -F <file>` (no PowerShell here-strings in Bash).
   Push only if the branch has a remote; never push main.

## Stop lines

When a prompt names a stop point ("tasks T1-T3 only"), stop there, hand off, and do not
start the next task.
