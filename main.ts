// main.ts — TANJUNG ARUN — BADAI ARUNIKA (gta6-01 entry program, Node 22).
// Hands the game in: copies this repo's game/ and screenshots/ into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library (vendor/makefun-game.ts). Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');

function copyTree(src, dest) {
  if (!existsSync(src)) throw new Error(`missing input directory: ${src}`);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

copyTree(gameSrc, join(outDir, 'game'));
copyTree(shotsSrc, join(outDir, 'screenshots'));

// The scorer's own caps (gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier written: ${dossier.length} bytes -> ${join(outDir, 'dossier.json')}`);
