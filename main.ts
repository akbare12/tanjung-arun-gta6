// TANJUNG ARUN — BADAI ARUNIKA v7 · main.ts (gta6-01)
// Program entri: salin game/ + screenshots/ dari repo ke /output dan tulis
// /output/dossier.json dengan buildDossier dari vendor/makefun-game.ts (kit, tanpa ubah).
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Cap scorer (reference/gate.json): hanya text_max_bytes yang membentuk byte;
// sisanya menolak entri yang scorer akan tolak (lebih dari 4 screenshot atau satu
// di atas 256 KiB; lebih dari 993 file di game/ atau 48 MiB file game, total, atau
// path di bawah game/ di atas 1000 byte).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('dossier.json written to', join(out, 'dossier.json'));
