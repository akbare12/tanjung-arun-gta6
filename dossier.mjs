// Deterministic dossier: every repo file (except .git and dossier.json itself,
// whose own hash cannot be self-contained) with sha256 + size. No timestamps,
// so two runs over identical content produce a byte-identical dossier.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repo = resolve(process.argv[2] || '.');
const out = join(repo, 'dossier.json');

function walk(dir, acc) {
  for (const name of readdirSync(dir).sort()) {
    if (name === '.git' || name === 'dossier.json') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile()) acc.push(p);
  }
  return acc;
}

const files = walk(repo, []).map((p) => {
  const buf = readFileSync(p);
  return {
    path: relative(repo, p).split('/').join('/'),
    sha256: createHash('sha256').update(buf).digest('hex'),
    size_bytes: buf.length
  };
}).sort((a, b) => a.path.localeCompare(b.path));

const dossier = {
  entry: 'gta6-01 v5 — TANJUNG ARUN: BADAI ARUNIKA',
  note: 'dossier.json lists every repo file except itself (self-hash impossible) and .git.',
  file_count: files.length,
  total_bytes: files.reduce((s, f) => s + f.size_bytes, 0),
  files
};
const text = JSON.stringify(dossier, null, 2) + '\n';
writeFileSync(out, text);
const hash = createHash('sha256').update(text).digest('hex');
console.log('dossier.json', text.length, 'bytes sha256', hash);
