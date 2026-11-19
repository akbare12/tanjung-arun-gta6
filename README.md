# TANJUNG ARUN — BADAI ARUNIKA

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A 3D low-poly open-world crime game in a coastal Indonesian city, built for the
[make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01). All-original: its own
city, characters, vehicles, names, story, art and music — nothing from Rockstar
Games or any other commercial game.

## The game

You are **Raka**, a driver in **Tanjung Arun**, a sun-soaked coastal city with
seven days to live: **Badai Arunika**, a Category 4 hurricane, makes landfall on
Day 6 at 18:00. Every day the wind rises, the rain thickens, and the **banjir
rob** (tidal flood) swallows more of the waterfront — and the city keeps paying
for people brave enough to work through it.

- **Drive & fight** — third-person on foot and behind the wheel (WASD), steal
  cars, drift for cash, outrun 6 named police units plus the ELANG-1 helicopter.
- **Wanted & disguise** — FACE / CAR / CLOTHES tabs; a respray clears your heat.
- **8 story missions + 4 disaster jobs** — street races, market ambushes, flood
  evacuations with real numbers, and the final Landfall escape.
- **A crew of 5 with perks** — Sinta (Drift +25%), Darma (Repair 25% off),
  Lestari (police search 20% shorter), Bimo (Damage +15%), plus the Q ability
  "SINTA: DRIFT BOOST".
- **12 districts with standing** — each with % SEEN and a gameplay effect
  (cops search less long, nitro refills faster, arms 15% off…).
- **Garage with prices** — Repair Rp 250rb, Respray Rp 400rb, Mesin +12% Rp 4jt,
  Armor Rp 3,6jt.
- **HUD** — mission tracker, police panel with tactics + distances in metres,
  weapon wheel with ammo, HEALTH + ARMOUR bars, round minimap with GPS route,
  named-character dialogue, 3 radio stations, save slots with detail.

## Run it

```bash
python3 -m http.server 8000 --directory game
```

Then open http://localhost:8000 in desktop Chrome. No build step, no network —
every file the game loads lives under `game/` (three.js is vendored at
`game/vendor/three.min.js`).

Controls: **WASD** drive / walk · **E** enter car · **F** steal car ·
**SPACE** handbrake · **Q** crew ability · **1–4** switch weapon ·
**M** map · **R** radio · **ESC** menu.

## Screenshots

`?shot=chase` (boulevard chase at sunset) · `?shot=combat` (market ambush) ·
`?shot=title` (city vista title) · `?shot=map` (full city map).

## Entry

Built for make.fun — [gta6-01 "Make GTA 6"](https://make.fun/bounty/gta6-01).
Try make.fun yourself: https://make.fun/?ref=v7znzvhb

## License

MIT — see [LICENSE](LICENSE).
