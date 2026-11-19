# TANJUNG ARUN — BADAI ARUNIKA

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original open-world crime game for the [make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01) — built in the spirit of GTA 6, with nothing from Rockstar Games: its own coastal Indonesian city, its own crew, its own story.

**The hook:** BADAI ARUNIKA — a 7-day hurricane countdown that is a *system*, not a theme. It ticks in every scene (hours remaining, CAT 3 → 4 → 5, wind km/h rising) and changes gameplay: the police helicopter is grounded above 220 km/h, a blackout chapter cuts the lights, a curfew empties the streets, the storm cone and flood zone redraw the map, and disaster side jobs (STORM CHASER, EVAC TAXI, SUPPLY RUN, LOOTER BOUNTY) pay the crew.

## Play

```sh
python3 -m http.server 8000 --directory game
```

Then open http://localhost:8000 — no build step, no network, everything is a static file under `game/`.

## The game

- **A city to explore** — Tanjung Arun: 12 named districts, a port, a beach, a fishing kampung, traffic, pedestrians, and a full city map with a 14-type POI legend and a GPS route.
- **Drive and steal** — 6 car models, carjacking (E), handbrake drifts, near-miss bonuses, a garage with priced upgrades.
- **Wanted, with a police that answers** — 5 stars, 6 named response units with distance in metres and tactics (PURSUIT / RAMMING / ROADBLOCK / SEARCHLIGHT / BOXING IN / ON FOOT / GROUNDED: WIND), a helicopter with a searchlight, roadblocks, and a disguise system (FACE / CAR / CLOTHES / CAMERA) plus a priced respray that clears your wanted level.
- **Missions and a story** — 8 named story missions with stages, payouts and status, chapter cards, a MISSION PASSED screen with grades and unlocks, and dialogue from a 5-person crew hunted by Det. Arya Nugraha.
- **HUD** — round minimap, wanted stars and heat, REP level, clock and day, storm countdown, radio widget (3 stations), mission objective, and floating action scores (DRIFT x3, NEAR MISS).
- **Save** — progress autosaves and continues from the title screen.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Drive / walk |
| E | Enter / exit car (steal the nearest car on foot) |
| Space | Handbrake / drift · continue on chapter & passed screens |
| Mouse | Aim · click to shoot (on foot) |
| M | Full city map |
| P | Phone — map, missions, contacts, stats, disguise |
| R | Respray — clear wanted (Rp 150.000) |
| 1 2 3 | Radio station |
| Esc | Pause (S saves, Q quits to title) |

## Structure

| File | Job |
| --- | --- |
| `game/index.html` | Page shell: canvas + module entry |
| `game/style.css` | Page chrome around the canvas |
| `game/src/config.js` | Data tables: districts, missions, crew, radio, storm, economy |
| `game/src/city.js` | City generator: roads, blocks, buildings, coast, POIs, flood line |
| `game/src/state.js` | Game state, storm clock, save/load |
| `game/src/audio.js` | Procedural WebAudio: engine, sirens, gunshots, radio |
| `game/src/entities.js` | Player, traffic, pedestrians, police AI |
| `game/src/missions.js` | Mission engine, stages, payouts, dialogue |
| `game/src/render.js` | World rendering: city, cars, police, storm, rain |
| `game/src/render2.js` | HUD, minimap, title, map, chapter, passed, phone screens |
| `game/src/shots.js` | Deterministic screenshot scene staging |
| `game/src/main.js` | Boot, input, game loop, screen machine |
| `main.ts` | Hands the game in: copies `game/` + `screenshots/`, writes `dossier.json` |
| `vendor/makefun-game.ts` | The kit's dossier library, unchanged |

## Screenshots

Four real renders of the game's own code: a police chase at sunset (cover), on-foot combat at night in the rain, the title screen, and the full city map.

## Referral

Try make.fun yourself: https://make.fun/?ref=v7znzvhb

## License

MIT — see [LICENSE](LICENSE). SPDX-License-Identifier: MIT.
