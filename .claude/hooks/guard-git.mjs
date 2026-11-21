// PreToolUse(Bash|PowerShell): block mass staging and malformed commit subjects.
let raw = '';
for await (const c of process.stdin) raw += c;
let cmd = '';
try { cmd = JSON.parse(raw).tool_input?.command ?? ''; } catch {}
const bad = [
  [/\bgit\s+add\s+(-A|--all|\.)(\s|$)/, 'Stage files by explicit path; never `git add -A` / `git add .`.'],
  [/\bgit\s+commit\b[^\n]*-m\s+["']@/, "Commit message starts with '@' (PowerShell here-string leaked into Bash). Use `git commit -F <file>`."],
];
for (const [re, msg] of bad) if (re.test(cmd)) { console.error('guard-git: ' + msg); process.exit(2); }
