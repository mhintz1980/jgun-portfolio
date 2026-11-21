// PostToolUse: run tsc only when a src/ TypeScript file was edited.
import { spawnSync } from 'node:child_process';
let raw = '';
for await (const c of process.stdin) raw += c;
let file = '';
try { file = JSON.parse(raw).tool_input?.file_path ?? ''; } catch {}
if (!/[\/]src[\/].*\.tsx?$/.test(file)) process.exit(0);
const r = spawnSync('npx', ['tsc', '--noEmit', '--incremental', '--tsBuildInfoFile', process.env.TEMP + '/jgun-tsc.tsbuildinfo'], { encoding: 'utf8', shell: true, timeout: 180000 });
if (r.status !== 0) {
  const out = ((r.stdout || '') + (r.stderr || '')).split('\n').slice(0, 25).join('\n');
  console.error('tsc --noEmit failed after editing ' + file + ':\n' + out);
  process.exit(2);
}
