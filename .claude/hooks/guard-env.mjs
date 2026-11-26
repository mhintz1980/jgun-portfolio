// PreToolUse(Read|Edit|Write|Bash|PowerShell): keep .env secrets (Higgsfield keys) out of the transcript.
// Blocks reading or writing .env / .env.* files with file tools, and shell commands that would print them.
// Allowed: .env.example / .env.sample, and commands that only load the file (node --env-file, source).
let raw = '';
for await (const c of process.stdin) raw += c;
let input = {};
try { input = JSON.parse(raw); } catch { process.exit(0); }
const ti = input.tool_input ?? {};

const SECRET = /(^|[\\/\s"'=])\.env(\.(?!example\b|sample\b|template\b)[\w.-]+)?(?=$|[\s"';|&)>])/;
const block = (msg) => { console.error('guard-env: ' + msg); process.exit(2); };

const file = ti.file_path ?? ti.path ?? '';
if (file && SECRET.test(file)) {
  block(`${file} holds secrets. Do not read or edit it; ask Mark to change it, and load it in code with node --env-file.`);
}

const cmd = ti.command ?? '';
if (cmd && SECRET.test(cmd)) {
  const PRINTERS = /\b(cat|type|head|tail|less|more|bat|grep|egrep|rg|findstr|sed|awk|sort|uniq|cut|strings|xxd|od|hexdump|base64|Get-Content|gc|Select-String|sls|code|notepad|cp|copy|Copy-Item|mv|move|Move-Item|scp|curl)\b/i;
  if (PRINTERS.test(cmd)) block('this command would print, copy or upload a .env file. Load it with node --env-file=.env.local instead.');
}
process.exit(0);
