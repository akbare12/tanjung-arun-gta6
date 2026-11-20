# TANJUNG ARUN — BADAI ARUNIKA

[![Open World](https://img.shields.io/badge/genre-open--world%20crime-FFD23F)](https://make.fun/c/gta6-01)
[![Three.js r160](https://img.shields.io/badge/three.js-r160-2FA8B5)](https://threejs.org)
[![Offline](https://img.shields.io/badge/runs-offline%20static-6B4A8F)](./game/index.html)

Game open-world crime 3D low-poly di kota pesisir Indonesia. Badai besar
tiba dalam 7 hari — rebut kota selagi air rob naik, polisi mengejar, dan
para fixer menagih janji.

## Cara main

Buka `game/index.html` di browser desktop (offline, tanpa server). Atau:

```sh
node --experimental-strip-types dossier.mjs   # render 4 screenshot + dossier.json
```

**Kontrol:** WASD — kemudi · Spasi — rem · M — peta.

## Sistem

- **Kota hidup:** 4 distrik bernama (PANTAI ROB, PELABUHAN, PASAR ARUN,
  KUMALA STRAND), toko dengan papan nama, pasar, taman, pelabuhan, pantai.
- **BANJIR ROB:** air pasang masuk kota — event skor `SELAMAT DARI ROB`.
- **Disguise / Heat:** ganti plat dan baju menurunkan heat polisi.
- **Polisi:** wanted level bintang 1–5, unit bernama dengan taktik
  (SPOTLIGHT / RAMMING / ROADBLOCK), helikopter dengan lampu sorot.
- **Misi & cerita:** 8 misi, chapter per hari, hitung mundur badai 7 hari.
- **HUD:** minimap bundar, health/armour/senjata, skor aksi melayang,
  save slot, bengkel & kru.

## Screenshot

1. `1-chase.jpg` — kejar-kejaran di JL. PANTAI ROB (Day 2)
2. `2-combat.jpg` — bertarung di tengah banjir rob Pasar Arun (Day 3)
3. `3-title.jpg` — layar judul + save slot
4. `4-map.jpg` — peta kota Tanjung Arun (Day 4)

Referral: `v7znzvhb`

Lisensi: MIT — lihat [LICENSE](./LICENSE).
