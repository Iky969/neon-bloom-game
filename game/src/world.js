// Neon Bloom - rules and simulation. No rendering and no DOM in here: the
// world is plain state advanced by update(), which keeps the game testable
// and lets the screenshot harness fast-forward it deterministically.
import { VIEW, PLAYER, WAVE, ENEMY, PICKUP, UPGRADES } from './config.js';
import { makeRandom, range, pick } from './random.js';
import { sound } from './audio.js';
import { getPointer, isDown, wasPressed } from './input.js';

function edgeSpawn(random) {
  const side = Math.floor(random() * 4);
  const pad = 30;
  if (side === 0) return { x: range(random, pad, VIEW.width - pad), y: -pad };
  if (side === 1) return { x: VIEW.width + pad, y: range(random, pad, VIEW.height - pad) };
  if (side === 2) return { x: range(random, pad, VIEW.width - pad), y: VIEW.height + pad };
  return { x: -pad, y: range(random, pad, VIEW.height - pad) };
}

function burst(w, x, y, color, count, speed = 170) {
  for (let i = 0; i < count; i += 1) {
    const angle = w.random() * Math.PI * 2;
    const velocity = range(w.random, speed * 0.25, speed);
    const life = range(w.random, 0.25, 0.7);
    w.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
      life, maxLife: life, color, size: range(w.random, 2, 4.5) });
  }
}

export function createWorld(seed) {
  const random = makeRandom(seed);
  let best = 0;
  try { best = Number(localStorage.getItem('neon-bloom-best')) || 0; } catch { best = 0; }
  return {
    random, state: 'title', time: 0, wave: 0, score: 0, best, combo: 1, comboTimer: 0,
    player: { x: VIEW.width / 2, y: VIEW.height / 2, vx: 0, vy: 0, health: PLAYER.maxHealth,
      radius: PLAYER.radius,
      fireTimer: 0, invuln: 0, fireDelay: PLAYER.fireDelay, spread: 0, overdrive: 0 },
    bullets: [], enemies: [], pickups: [], particles: [],
    toSpawn: 0, spawnTimer: 0, waveTimer: 0, banner: '', bannerTimer: 0, shake: 0,
    upgrades: UPGRADES.slice(), muted: false,
  };
}

export function startGame(w) {
  w.state = 'playing'; w.wave = 0; w.score = 0; w.combo = 1; w.comboTimer = 0;
  w.player.health = PLAYER.maxHealth; w.player.fireDelay = PLAYER.fireDelay;
  w.player.spread = 0; w.player.overdrive = 0; w.player.invuln = 1.5;
  w.bullets.length = 0; w.enemies.length = 0; w.pickups.length = 0; w.particles.length = 0;
  beginWave(w);
}

function beginWave(w) {
  w.wave += 1;
  w.state = 'playing';
  w.toSpawn = Math.min(WAVE.first + WAVE.perWave * (w.wave - 1), WAVE.maxAlive);
  w.spawnTimer = 0.4;
  w.banner = `WAVE ${w.wave}`;
  w.bannerTimer = 1.5;
  sound.wave();
}

function spawnEnemy(w, forcedType) {
  const at = edgeSpawn(w.random);
  const roll = w.random();
  let type = forcedType || (roll < 0.5 ? 'drifter' : roll < 0.78 ? 'charger' : 'splitter');
  if (w.wave < 2 && type === 'splitter') type = 'drifter';
  const spec = ENEMY[type];
  const health = spec.health + Math.floor((w.wave - 1) / 3);
  w.enemies.push({ x: at.x, y: at.y, vx: 0, vy: 0, type, radius: spec.radius,
    health, color: spec.color, score: spec.score, flash: 0,
    angle: w.random() * Math.PI * 2, phase: w.random() * 6.28 });
}

function fire(w, pointer) {
  const p = w.player;
  const angle = Math.atan2(pointer.y - p.y, pointer.x - p.x);
  const speed = PLAYER.bulletSpeed;
  const angles = p.spread ? [angle - 0.2, angle, angle + 0.2] : [angle];
  for (const a of angles) {
    w.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: PLAYER.bulletLife, color: p.spread ? PALETTE_BOLT : '#8ff9ff', damage: 1 });
  }
  burst(w, p.x + Math.cos(angle) * 16, p.y + Math.sin(angle) * 16, '#8ff9ff', 3, 90);
  if (p.spread) sound.spread(); else sound.shoot();
}
const PALETTE_BOLT = '#ffd166';

function hurtPlayer(w) {
  const p = w.player;
  if (p.invuln > 0) return;
  p.health -= 1;
  p.invuln = PLAYER.invulnerable;
  w.shake = 12;
  burst(w, p.x, p.y, '#ff5c8a', 22, 240);
  sound.hit();
  if (p.health <= 0) {
    p.health = 0;
    w.state = 'gameover';
    w.best = Math.max(w.best, Math.floor(w.score));
    try { localStorage.setItem('neon-bloom-best', String(w.best)); } catch { /* storage optional */ }
    sound.over();
  }
}

function killEnemy(w, enemy, index) {
  const spec = ENEMY[enemy.type];
  w.score += spec.score * w.combo;
  w.combo = Math.min(5, w.combo + (w.comboTimer > 0 ? 0.25 : 0));
  w.comboTimer = 2.6;
  burst(w, enemy.x, enemy.y, enemy.color, enemy.type === 'splitter' ? 26 : 14);
  sound.kill();
  w.enemies.splice(index, 1);
  if (enemy.type === 'splitter') {
    for (let i = 0; i < 2; i += 1) spawnEnemy(w, 'mote');
    const motes = w.enemies.slice(-2);
    for (const mote of motes) { mote.x = enemy.x; mote.y = enemy.y; }
  }
  if (w.random() < 0.13 || (enemy.type === 'splitter' && w.random() < 0.5)) {
    const roll = w.random();
    const type = roll < 0.68 ? 'energy' : roll < 0.88 ? 'repair' : 'overdrive';
    w.pickups.push({ x: enemy.x, y: enemy.y, vx: 0, vy: 0, type,
      life: PICKUP.duration, color: PICKUP[type].color, radius: 9 });
  }
}

function collectPickup(w, pickup, index) {
  const p = w.player;
  if (pickup.type === 'energy') { w.score += 75 * w.combo; sound.pickup(); }
  if (pickup.type === 'repair') { p.health = Math.min(PLAYER.maxHealth, p.health + 1); sound.repair(); }
  if (pickup.type === 'overdrive') { p.overdrive = PICKUP.duration; sound.wave(); }
  burst(w, pickup.x, pickup.y, pickup.color, 12, 130);
  w.pickups.splice(index, 1);
}

export function chooseUpgrade(w, id) {
  if (w.state !== 'waveclear') return;
  const p = w.player;
  if (id === 'repair') p.health = Math.min(PLAYER.maxHealth, p.health + 2);
  if (id === 'rapid') p.fireDelay = Math.max(0.055, p.fireDelay * 0.72);
  if (id === 'spread') p.spread = Math.min(2, p.spread + 1);
  sound.repair();
  beginWave(w);
}

// pointerOverride lets the deterministic screenshot runner aim without a mouse.
export function update(w, dt, pointerOverride = null) {
  w.time += dt;
  const p = w.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.overdrive = Math.max(0, p.overdrive - dt);
  w.shake = Math.max(0, w.shake - dt * 34);
  if (w.comboTimer > 0) { w.comboTimer -= dt; if (w.comboTimer <= 0) w.combo = 1; }
  for (let i = w.particles.length - 1; i >= 0; i -= 1) {
    const q = w.particles[i];
    q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
    q.vx *= 0.96; q.vy *= 0.96;
    if (q.life <= 0) w.particles.splice(i, 1);
  }
  if (w.bannerTimer > 0) w.bannerTimer -= dt;

  if (w.state === 'title') {
    if (wasPressed('enter') || wasPressed(' ') || (pointerOverride && pointerOverride.clicked)) startGame(w);
    return;
  }
  if (w.state === 'gameover') {
    if (wasPressed('enter') || wasPressed('r') || (pointerOverride && pointerOverride.clicked)) startGame(w);
    return;
  }
  if (w.state === 'waveclear') {
    w.waveTimer -= dt;
    for (const upgrade of w.upgrades) {
      if (wasPressed(upgrade.key)) { chooseUpgrade(w, upgrade.id); return; }
    }
    if (w.waveTimer <= 0) chooseUpgrade(w, 'repair');
    return;
  }

  // --- movement -----------------------------------------------------------
  let dx = (isDown('d') || isDown('arrowright') ? 1 : 0) - (isDown('a') || isDown('arrowleft') ? 1 : 0);
  let dy = (isDown('s') || isDown('arrowdown') ? 1 : 0) - (isDown('w') || isDown('arrowup') ? 1 : 0);
  if (pointerOverride && pointerOverride.move) { dx = pointerOverride.move.x; dy = pointerOverride.move.y; }
  const length = Math.hypot(dx, dy) || 1;
  p.vx = (dx / length) * PLAYER.speed;
  p.vy = (dy / length) * PLAYER.speed;
  p.x = Math.max(p.radius, Math.min(VIEW.width - p.radius, p.x + p.vx * dt));
  p.y = Math.max(p.radius, Math.min(VIEW.height - p.radius, p.y + p.vy * dt));

  // --- shooting -----------------------------------------------------------
  p.fireTimer -= dt;
  const pointer = pointerOverride || getPointer();
  const firing = pointerOverride ? pointerOverride.down : (pointer.down || isDown(' '));
  if (firing && p.fireTimer <= 0) {
    fire(w, pointer);
    p.fireTimer = p.fireDelay * (p.overdrive > 0 ? 0.55 : 1);
  }

  // --- bullets ------------------------------------------------------------
  for (let i = w.bullets.length - 1; i >= 0; i -= 1) {
    const b = w.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > VIEW.width + 10 || b.y < -10 || b.y > VIEW.height + 10) {
      w.bullets.splice(i, 1); continue;
    }
    for (let j = w.enemies.length - 1; j >= 0; j -= 1) {
      const e = w.enemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 4) {
        e.health -= b.damage; e.flash = 0.09;
        burst(w, b.x, b.y, b.color, 4, 100);
        w.bullets.splice(i, 1);
        if (e.health <= 0) killEnemy(w, e, j);
        break;
      }
    }
  }

  // --- spawning and enemies ----------------------------------------------
  if (w.toSpawn > 0) {
    w.spawnTimer -= dt;
    if (w.spawnTimer <= 0 && w.enemies.length < WAVE.maxAlive) {
      spawnEnemy(w); w.toSpawn -= 1;
      w.spawnTimer = Math.max(0.22, WAVE.spawnDelay - w.wave * 0.045) * range(w.random, 0.7, 1.25);
    }
  }
  for (let i = w.enemies.length - 1; i >= 0; i -= 1) {
    const e = w.enemies[i];
    e.flash = Math.max(0, e.flash - dt);
    e.phase += dt;
    const angle = Math.atan2(p.y - e.y, p.x - e.x);
    const speed = ENEMY[e.type].speed;
    if (e.type === 'drifter') {
      const wobble = Math.sin(e.phase * 2.4) * 0.5;
      e.vx = Math.cos(angle + wobble) * speed;
      e.vy = Math.sin(angle + wobble) * speed;
    } else if (e.type === 'charger') {
      const pulse = 0.55 + 0.45 * Math.max(0, Math.sin(e.phase * 3));
      e.vx = Math.cos(angle) * speed * pulse;
      e.vy = Math.sin(angle) * speed * pulse;
    } else {
      e.vx = Math.cos(angle) * speed;
      e.vy = Math.sin(angle) * speed;
    }
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) { hurtPlayer(w); e.health = 0; killEnemy(w, e, i); }
  }

  // --- pickups ------------------------------------------------------------
  for (let i = w.pickups.length - 1; i >= 0; i -= 1) {
    const item = w.pickups[i];
    item.life -= dt;
    const angle = Math.atan2(p.y - item.y, p.x - item.x);
    item.vx += Math.cos(angle) * 340 * dt;
    item.vy += Math.sin(angle) * 340 * dt;
    item.vx *= 0.95; item.vy *= 0.95;
    item.x += item.vx * dt; item.y += item.vy * dt;
    if (item.life <= 0) { w.pickups.splice(i, 1); continue; }
    if (Math.hypot(item.x - p.x, item.y - p.y) < item.radius + p.radius) collectPickup(w, item, i);
  }

  if (w.toSpawn === 0 && w.enemies.length === 0 && w.state === 'playing') {
    w.state = 'waveclear';
    w.waveTimer = WAVE.breakTime;
    w.score += 200 * w.wave;
    w.banner = 'WAVE CLEAR';
    w.bannerTimer = WAVE.breakTime;
  }
}
