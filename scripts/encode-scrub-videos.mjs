import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SETS = [
  { dir: 'proto/merged/ch4/cage', crf: 23 },
  { dir: 'proto/merged/ch4/pump', crf: 23 },
  { dir: 'proto/merged/ch4/receiver', crf: 23 },
  { dir: 'proto/merged/arm', crf: 23 },
];

for (const { dir, crf } of SETS) {
  const out = path.join(dir, 'turn.mp4');
  console.log(`Encoding ${out} (crf=${crf}, g=6)...`);
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', '30', '-i', path.join(dir, 's%03d.webp'),
    '-framerate', '30', '-i', path.join(dir, 'l%03d.webp'),
    '-filter_complex',
    '[0:v]format=rgba,split=2[sa][sb];[sa]premultiply=inplace=1,format=rgb24[top];[sb]alphaextract,format=rgb24[mid];[1:v]format=rgb24[bot];[top][mid][bot]vstack=inputs=3,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level:v', '5.0',
    '-pix_fmt', 'yuv420p',
    '-g', '6',
    '-keyint_min', '6',
    '-sc_threshold', '0',
    '-bf', '0',
    '-crf', String(crf),
    '-preset', 'slow',
    '-color_range', 'tv',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-colorspace', 'bt709',
    '-movflags', '+faststart',
    '-an',
    out,
  ], { stdio: 'inherit' });
  const bytes = fs.statSync(out).size;
  console.log(`  -> ${out}: ${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes} bytes)`);
}
