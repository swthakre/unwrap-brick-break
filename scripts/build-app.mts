import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const r = await build({
  entryPoints: ['src/game/app.ts'], bundle: true, minify: true, format: 'iife', target: 'es2020',
  write: false, legalComments: 'none', define: { 'process.env.NODE_ENV': '"production"' },
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const shell = readFileSync('scripts/shell.html', 'utf8');
const fragment = shell.replace('/*APP*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', fragment);
writeFileSync('dist/index.html', '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + fragment + '\n</html>');
console.log('built', (fragment.length / 1024).toFixed(0) + ' KB');
