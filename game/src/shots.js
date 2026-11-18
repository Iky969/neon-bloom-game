// Deterministic screenshot modes. The cover, play and results images are
// real frames rendered by the game's own renderer after simulate() drives the
// rules with a scripted pointer, so each shot shows an actual moment of play.
import { startGame, chooseUpgrade, update } from './world.js';
import { WAVE } from './config.js';

export function parseShotMode() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('shot');
  if (!mode) return null;
  return { mode, seed: Number(params.get('seed')) || 1337 };
}

function aimAt(w, x, y) {
  w.aim = Math.atan2(y - w.player.y, x - w.player.x);
}

function simulate(w, steps, script) {
  for (let i = 0; i < steps; i += 1) {
    if (w.state === 'waveclear') {
      chooseUpgrade(w, ['spread', 'rapid', 'repair'][Math.floor(i / 90) % 3]);
      continue;
    }
    const time = i / 60;
    const control = script(time, w);
    aimAt(w, control.x, control.y);
    update(w, 1 / 60, control);
    if (w.state === 'gameover' && script.stopOnDeath) break;
  }
}

export function prepareShot(w, mode, seed) {
  if (mode === 'start') {
    w.time = 1.4;
    return;
  }
  if (mode === 'play') {
    startGame(w);
    simulate(w, 60 * 8, (time, world) => {
      const homeX = 480 + Math.cos(time * 0.7) * 70;
      const homeY = 300 + Math.sin(time * 0.6) * 55;
      return {
        x: 480 + Math.cos(time * 1.15) * 150,
        y: 300 + Math.sin(time * 0.87) * 100,
        down: Math.sin(time * 5) > 0,
        clicked: false,
        move: { x: homeX - world.player.x, y: homeY - world.player.y },
      };
    });
    w.bannerTimer = 0;
    w.shake = 0;
    return;
  }
  if (mode === 'upgrade') {
    prepareShot(w, 'play', seed);
    w.state = 'waveclear';
    w.waveTimer = WAVE.breakTime;
    w.banner = '';
    w.bannerTimer = 0;
    w.aim = 0;
    return;
  }
  if (mode === 'end') {
    startGame(w);
    simulate(w, 60 * 150, (time, world) => ({
      x: 480 + Math.sin(time) * 60,
      y: 300 + Math.cos(time * 0.7) * 40,
      down: false,
      clicked: false,
      move: { x: 0, y: 0 },
      stopOnDeath: world.state === 'gameover',
    }));
    w.time += 0.6;
    return;
  }
  return prepareShot(w, 'play', seed);
}
