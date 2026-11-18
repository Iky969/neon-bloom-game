# neon-bloom-game

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Iky969/neon-bloom-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Iky969/neon-bloom-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Neon Bloom** is an original twin-stick arena survival game that runs entirely
from static files in a desktop browser. Move with WASD, aim with the mouse and
hold the mouse button or space to fire. Survive waves of drifters, chargers and
splitters, collect energy, repair and overdrive pickups, chain kills into a
score multiplier, and choose an upgrade between waves. The run ends when your
hull reaches zero; restart with Enter, R or a click.

The game has a title screen, a complete scoring and health HUD, between-wave
upgrade choices, a game-over/results screen with a personal best, particle and
screen-shake feedback, and synthesised WebAudio sound effects. All art is drawn
from geometry at runtime — there are no downloaded assets and no network calls.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Build the judged output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the kit's vendored `vendor/makefun-game.ts`.

## Layout

- `game/index.html` — the page that opens in the browser
- `game/src/config.js` — game rules, tuning and palette
- `game/src/world.js` — simulation, spawning, collisions and scoring
- `game/src/render.js` — all drawing, HUD and menus
- `game/src/input.js` — keyboard and mouse handling
- `game/src/audio.js` — synthesised sound effects
- `game/src/random.js` — deterministic random numbers for screenshot runs
- `game/src/shots.js` — deterministic screenshot modes
- `game/src/main.js` — bootstrap and frame loop
- `screenshots/` — three or four real browser captures of the game

---

<sub>Entered on [make.fun](https://make.fun/?ref=IKY969&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
