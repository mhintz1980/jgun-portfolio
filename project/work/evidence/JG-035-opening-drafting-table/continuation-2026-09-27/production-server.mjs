import { build, preview } from 'vite';
import path from 'node:path';
const out = path.resolve('project/work/evidence/JG-035-opening-drafting-table/continuation-2026-09-27/production');
const options = { cacheDir: path.resolve(out, '../vite-cache'), build: {outDir: out, emptyOutDir: false}, preview: {host:'localhost',port:4173,strictPort:true} };
if(process.argv.includes('--build')) await build(options);
const server = await preview(options);
server.printUrls();
