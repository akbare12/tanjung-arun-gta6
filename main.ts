// TANJUNG ARUN — BADAI ARUNIKA v8 (gta6-01)
// Program penyerahan entry: menyalin game/ dan screenshots/ dari repo ini ke
// direktori output, lalu menulis dossier.json lewat pustaka make.fun yang
// dibundel di vendor/. Dijalankan dengan Node 22+:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Di dalam grader, MAKEFUN_OUTPUT_DIR tidak disetel dan output jatuh ke /output.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Batas scorer (reference/gate.json): 4 screenshot @ 256 KiB, game/ maks 993
// file / 48 MiB, teks dossier maks 160 KiB, dossier maks 1,5 MiB.
const DOSSIER_OPTS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_OPTS));
