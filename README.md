# TANJUNG ARUN — BADAI ARUNIKA

[![bounty gta6-01](https://img.shields.io/badge/bounty-gta6--01-E86A92)](https://make.fun)
[![license MIT](https://img.shields.io/badge/license-MIT-37C978)](./LICENSE)
[![offline static](https://img.shields.io/badge/offline-static-2FA8B5)](./index.html)

Game open-world crime 3D low-poly di kota pesisir Indonesia. Badai Arunika datang
dalam 7 hari — sementara itu, kejar-kejaran dengan polisi, kumpulkan uang, dan
bertahan dari **banjir rob** yang menggenang masuk ke jalan-jalan kota.

> Referral: **v7znzvhb**

## Cara main

Buka `index.html` di browser (tanpa server, tanpa internet — Three.js sudah
di-vendor di `vendor/three.min.js`). Mode interaktif jalan otomatis; tambahkan
`?shot=chase|combat|title|map` di URL untuk melihat 4 adegan kunci yang sudah
difoto di `screenshots/`.

- **Chase** — Polisi mengejar mobil merahmu dari belakang, helikopter menyorot
  dari atas, banjir rob di depan.
- **Combat** — Baku tembak di persimpangan yang tergenang. HUD lengkap:
  Health, Armour, senjata, dan amunisi.
- **Title** — Layar judul + ringkasan save.
- **Map** — Peta kota: distrik, rute, dan zona banjir rob.

## Kontrol

| Tombol | Aksi |
| ------ | ---- |
| `W A S D` / panah | Kemudi mobil |
| `Spasi` | Rem tangan / drift |
| `Shift` | Nitro |
| `E` | Ganti disguise (turunkan heat) |
| `F` | Masuk / keluar mobil |
| `Klik kiri` | Tembak (mode jalan kaki) |
| `R` | Isi ulang senjata |
| `M` | Peta |
| `Esc` | Jeda |

## Sistem

- **Hitung mundur badai 7 hari** — kategori badai naik tiap hari (CAT 2 → CAT 4),
  banjir rob makin luas.
- **Disguise / Heat** — ganti penampilan untuk menurunkan level buronan polisi.
- **Skor aksi melayang** — drift, kejar-kejaran, dan tembakan tepat memberi
  skor yang melayang di layar.
- **Misi & koleksi** — 8 misi utama, 24 koleksi tersebar di kota.

## Struktur

```
index.html            entry point (HUD DOM + canvas)
vendor/three.min.js   Three.js r160 (offline)
src/rng.js            RNG deterministik (mulberry32)
src/textures.js       tekstur kanvas: fasad hidup, jalan, papan nama
src/city.js           kota: gedung, pohon, lampu, banjir rob
src/vehicles.js       mobil, mobil polisi, helikopter, pejalan kaki
src/main.js           scene, kamera per shot, HUD
shots/render.mjs      render 4 screenshot via CDP (headless Chrome)
screenshots/          1-chase.jpg, 2-combat.jpg, 3-title.jpg, 4-map.jpg
dossier.json          daftar file + sha256 (deterministik)
```

## Lisensi

MIT — lihat [LICENSE](./LICENSE).
