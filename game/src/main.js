// Neon Bloom - bootstrap. Sets up the canvas, starts the frame loop, and
// honours the ?shot= modes used to capture the judging screenshots.
import { VIEW } from './config.js';
import { createWorld, update } from './world.js';
import { render } from './render.js';
import { attachInput, getPointer, consumeFrame } from './input.js';
import { sound } from './audio.js';
import { parseShotMode, prepareShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
attachInput(canvas);

const shot = parseShotMode();
const world = createWorld(shot ? shot.seed : Date.now());

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'p') {
    world.muted = !world.muted;
    sound.setMuted(world.muted);
  }
});

if (shot) {
  prepareShot(world, shot.mode, shot.seed);
  render(ctx, world);
  document.documentElement.dataset.shotReady = 'true';
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const pointer = getPointer();
    world.aim = Math.atan2(pointer.y - world.player.y, pointer.x - world.player.x);
    update(world, dt);
    render(ctx, world);
    consumeFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
