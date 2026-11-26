// PreToolUse(Write|Bash|PowerShell): stop scratch files (logs, commit-message drafts, screenshots)
// from landing in the repo root. Existing root files can still be overwritten.
// Put scratch in .scratch/ (gitignored), the session scratchpad, or project/work/evidence/.
import { existsSync } from 'node:fs';
import path from 'node:path';

let raw = '';
for await (const c of process.stdin) raw += c;
let input = {};
try { input = JSON.parse(raw); } catch { process.exit(0); }
const ti = input.tool_input ?? {};
const root = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd());
const cwd = path.resolve(input.cwd ?? root);

const SCRATCH_EXT = /\.(log|txt|png|jpe?g|webp|gif|bmp|mp4|webm|mov|csv|tsv|out|err|dump|tmp|bak|diff|patch|zip)$/i;
const SCRATCH_NAME = /^\.?(scratch|tmp|temp|debug|out|output|commit[-_]?msg|msg)([-_.]|$)/i;

function check(target, base) {
  if (!target || /^(\/dev\/null|nul|\$null)$/i.test(target)) return;
  const abs = path.resolve(base, target);
  if (path.dirname(abs).toLowerCase() !== root.toLowerCase()) return;
  if (existsSync(abs)) return;
  const name = path.basename(abs);
  if (SCRATCH_EXT.test(name) || SCRATCH_NAME.test(name)) {
    console.error(`guard-root-files: refusing to create ${name} in the repo root. ` +
      'Use .scratch/ (gitignored), the session scratchpad, or project/work/evidence/<ticket>/.');
    process.exit(2);
  }
}

if (ti.file_path) check(ti.file_path, cwd);

const cmd = ti.command ?? '';
// Shell redirections (> file, >> file, 2> file) and PowerShell Out-File / Set-Content / Tee-Object.
for (const m of cmd.matchAll(/(?:^|[^>&0-9])[12]?>>?\s*["']?([^\s"'|&;<>()]+)/g)) check(m[1], cwd);
for (const m of cmd.matchAll(/\b(?:Out-File|Set-Content|Add-Content|Tee-Object|tee)\b(?:\s+-\w+)*\s+["']?([^\s"'|&;<>()]+)/gi)) check(m[1], cwd);
process.exit(0);
