# TANJUNG ARUN — BADAI ARUNIKA

[![make.fun](https://img.shields.io/badge/make.fun-gta6--01-FF6B6B)](https://make.fun)
[![version](https://img.shields.io/badge/version-v7-6B4A8F)](https://make.fun)
[![engine](https://img.shields.io/badge/engine-Three.js%20r160-2FA8B5)](https://threejs.org)

Game 3D low-poly open-world: kota pesisir Indonesia, **hitung mundur badai 7 hari**,
sistem disguise/heat, banjir rob dramatis, dan polisi yang mengejar mobil kita.

Referral: `v7znzvhb`

## Mainkan

Buka `game/index.html` di browser (butuh WebGL). Pilih shot lewat query:

- `?shot=1` — Chase: kejar-kejaran di Jalan Dermaga (polisi di belakang, heli ELANG-2, perahu di pier)
- `?shot=2` — Combat: pasar banjir malam hujan, HUD lengkap
- `?shot=3` — Title: menu + 3 save slot + kru
- `?shot=4` — Map: peta kota + daftar misi

Atau jalankan server statis: `npx serve game` lalu buka `http://localhost:3000/?shot=1`.

## Sistem

- **Badai 7 hari:** Day 2 (CAT 2) → Day 3 (CAT 3) → Day 4 (CAT 4), hitung mundur 4D 0H → 2D 9H
- **Disguise / heat:** wanted stars, dispatch polisi bernama (KITE-1, CORAL-48, BADAI-7, heli ELANG-2)
- **Banjir rob:** air pasang masuk kota, sampah mengambang, perahu penyelamat, garis air di dinding
- **Kru:** JOEL (fixer), SARI (driver), UJANG (mekanik), RATNA (info)
- **Radio:** ARUN FM 98.4 · GELOMBANG PANTAI 91.2 · DANGDUT ROB 87.7 · SUARA BADAI 104.5
- **8 misi cerita** bernama, 6 distrik + standing, skor aksi melayang (+150 / +500)

## Progresi angka (koheren di semua shot)

| Shot | Hari | Badai | CAT | Skor | Uang | Misi |
|------|------|-------|-----|------|------|------|
| 1 Chase | Day 2 17:40 | 4D 0H | 2 | 150 | Rp 12.000.000 | 2/8 |
| 2 Combat | Day 3 02:15 | 3D 6H | 3 | 187 | Rp 21.750.000 | 3/8 |
| 3 Title | Day 4 09:05 | 2D 9H | 4 | 239 | Rp 38.420.000 | 5/8 |
| 4 Map | Day 4 09:05 | 2D 9H | 4 | 239 | Rp 38.420.000 | 5/8 |

## Dossier

`node dossier.mjs` membangun `dossier.json` dari 4 screenshot (1280×720, ≤256 KiB)
plus metadata + sha256. Deterministik: dua run menghasilkan byte yang identik.

## Lisensi

MIT — lihat `LICENSE`.
