# TANJUNG ARUN — BADAI ARUNIKA

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/akbare12/tanjung-arun-gta6/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A 3D low-poly open-world crime game in the spirit of GTA 6 — built for the
[make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01). All-original:
its own coastal Indonesian city, characters, vehicles, names and story.
Nothing from Rockstar Games.

## The game

**Tanjung Arun** is a coastal city with seven days to live. Hurricane
Arunika is coming — landfall Day 6 · 18:00 — and every day the wind rises,
the rain gets heavier, and the tidal flood (**banjir rob**) swallows more
of the streets. You are Raka, a wheelman caught between Det. Arya's police
and a crew of five trying to get out before the storm hits.

- **Drive and walk** a full 3D city: palm-lined coastal boulevard, night
  market, docks, marina, hills — on foot and by car, with traffic and
  pedestrians.
- **Wanted system**: six named police units (plus heli ELANG-1) with
  tactics and distances in metres; disguise tabs (FACE / CAR / CLOTHES)
  and respray to clear your heat.
- **Combat**: health + armour, a 4-slot weapon wheel with ammo, floating
  action scores (DRIFT x3, NEAR MISS, HEADSHOT, LOOTER DOWN).
- **8 story missions + 4 repeatable disaster jobs** (evacuate the flood
  zones, hunt looters, chase the storm), a street race, a crew of five
  with perks and active abilities (Q: SINTA — DRIFT BOOST).
- **Progression**: money, REP ranks (RUNNER → WHEELMAN → ENFORCER),
  district standing with gameplay effects, a garage with priced upgrades,
  save slots, career stats, 24 collectible shells.
- **HUD**: mission tracker, storm countdown, round minimap with GPS
  route, radio (3 stations), named-character dialogue, big speedometer.

## Run it

```sh
python3 -m http.server 8000 --directory game
```

Then open http://localhost:8000 — no build step, no network, everything
is vendored under `game/` (Three.js as `game/vendor/three.min.js`).

## Controls

- **WASD** drive / walk · **E** enter or exit the car · **SPACE** shoot
- **Q** Drift Boost (Sinta) · **R** change radio · **M** city map
- **1–4** switch weapon · **ESC** menu

## Screenshots

`1-chase` — police chase on the boulevard · `2-combat` — on-foot fight at
the docks · `3-title` — title screen over the storm skyline · `4-map` —
the full city map with flood zones and garage prices.

## Referral

Play more make.fun bounties: https://make.fun/?ref=v7znzvhb

## License

MIT — see [LICENSE](LICENSE).
