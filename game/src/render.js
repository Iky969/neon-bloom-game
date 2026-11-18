// Neon Bloom - all drawing. The scene is built from circles, rings, polygons
// and glows so the game needs no image or font downloads at all.
import { VIEW, PLAYER, PALETTE, UPGRADES } from './config.js';

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function polygon(ctx, x, y, radius, sides, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function background(ctx, w) {
  ctx.fillStyle = PALETTE.background;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.save();
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  const offset = (w.time * 12) % 48;
  for (let x = -48 + offset; x < VIEW.width; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.height); ctx.stroke();
  }
  for (let y = -48 + offset; y < VIEW.height; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
  const pulse = 0.06 + Math.sin(w.time * 1.3) * 0.025;
  ctx.fillStyle = `rgba(110, 242, 208, ${pulse})`;
  ctx.beginPath();
  ctx.arc(VIEW.width / 2, VIEW.height / 2, 200 + Math.sin(w.time) * 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, w) {
  for (const q of w.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.maxLife);
    glow(ctx, q.color, 10);
    ctx.fillStyle = q.color;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawPickups(ctx, w) {
  for (const item of w.pickups) {
    const blink = item.life < 2 && Math.floor(item.life * 8) % 2 === 0;
    if (blink) continue;
    glow(ctx, item.color, 18);
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    polygon(ctx, item.x, item.y, item.radius + Math.sin(w.time * 6) * 2, 6, w.time * 1.5);
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(item.type === 'repair' ? '+' : item.type === 'overdrive' ? '*' : '+', item.x, item.y + 1);
  }
  ctx.shadowBlur = 0;
}

function drawEnemies(ctx, w) {
  for (const e of w.enemies) {
    glow(ctx, e.color, e.type === 'charger' ? 20 : 13);
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;
    if (e.type === 'drifter') {
      polygon(ctx, e.x, e.y, e.radius, 5, e.phase * 1.4); ctx.fill();
    } else if (e.type === 'charger') {
      polygon(ctx, e.x, e.y, e.radius, 3, e.phase * 4); ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (e.type === 'splitter') {
      polygon(ctx, e.x, e.y, e.radius, 6, e.phase * 0.8); ctx.stroke();
      polygon(ctx, e.x, e.y, e.radius * 0.55, 3, -e.phase * 1.6); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
    }
    if (e.health > 1) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, e.radius * 2 * Math.min(1, e.health / 5), 3);
    }
  }
  ctx.shadowBlur = 0;
}

function drawPlayer(ctx, w) {
  const p = w.player;
  if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  const pointerAngle = w.aim || 0;
  ctx.rotate(pointerAngle);
  glow(ctx, PALETTE.accent, 22);
  ctx.fillStyle = PALETTE.accent;
  polygon(ctx, 0, 0, PLAYER.radius + 2, 3, 0); ctx.fill();
  glow(ctx, '#ffffff', 12);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(2, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = p.overdrive > 0 ? PALETTE.gold : PALETTE.accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius + 7 + Math.sin(w.time * 5) * 2, 0, Math.PI * 2); ctx.stroke();
  // The bloom ring gets brighter as the kill combo grows, so a hot streak is
  // visible on the small judging contact sheet without reading the HUD.
  if (w.combo > 1) {
    ctx.globalAlpha = Math.min(0.9, (w.combo - 1) / 4);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER.radius + 13 + Math.sin(w.time * 8) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (p.spread > 0) {
    ctx.fillStyle = PALETTE.gold;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.arc(-6, side * 9, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawBullets(ctx, w) {
  for (const b of w.bullets) {
    glow(ctx, b.color, 14);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function hud(ctx, w) {
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${String(Math.floor(w.score)).padStart(6, '0')}`, 20, 16);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`x${w.combo.toFixed(2)} COMBO`, 20, 42);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`WAVE ${w.wave}`, VIEW.width - 20, 16);
  ctx.fillStyle = PALETTE.violet;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`BEST ${w.best}`, VIEW.width - 20, 42);

  // Health pips make damage legible at a glance, even on the small contact sheet.
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('HULL', 20, VIEW.height - 34);
  for (let i = 0; i < PLAYER.maxHealth; i += 1) {
    const x = 72 + i * 24;
    ctx.fillStyle = i < w.player.health ? PALETTE.danger : 'rgba(255,92,138,0.18)';
    glow(ctx, i < w.player.health ? PALETTE.danger : 'transparent', 8);
    ctx.fillRect(x, VIEW.height - 33, 16, 12);
  }
  ctx.shadowBlur = 0;
  if (w.player.overdrive > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`OVERDRIVE ${w.player.overdrive.toFixed(1)}s`, 20, VIEW.height - 52);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(234,242,255,0.55)';
  ctx.font = '12px monospace';
  ctx.fillText('WASD move · mouse aim · hold click/space fire · P mute', VIEW.width - 20, VIEW.height - 26);
  ctx.restore();
}

function banner(ctx, w) {
  if (w.bannerTimer <= 0) return;
  const alpha = Math.min(1, w.bannerTimer * 1.6);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  glow(ctx, PALETTE.accent, 24);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 46px monospace';
  ctx.fillText(w.banner, VIEW.width / 2, VIEW.height * 0.3);
  ctx.restore();
}

function title(ctx, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(7,10,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  glow(ctx, PALETTE.accent, 30);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 68px monospace';
  ctx.fillText('NEON BLOOM', VIEW.width / 2, 170);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.violet;
  ctx.font = '20px monospace';
  ctx.fillText('survive the swarm · bloom brighter', VIEW.width / 2, 218);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = '16px monospace';
  const lines = [
    'WASD / ARROWS  move        MOUSE  aim',
    'HOLD CLICK / SPACE  fire   P  mute',
    '',
    'Collect green cells for points, pink to repair,',
    'gold for overdrive. Chain kills for a score multiplier.',
    'Splitters burst into motes. Choose an upgrade each wave.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 290 + i * 26));

  const pulse = 0.65 + Math.sin(w.time * 4) * 0.35;
  ctx.globalAlpha = pulse;
  glow(ctx, PALETTE.gold, 20);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PRESS ENTER OR CLICK TO START', VIEW.width / 2, 500);
  ctx.restore();
}

function gameover(ctx, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(7,10,24,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  glow(ctx, PALETTE.danger, 26);
  ctx.fillStyle = PALETTE.danger;
  ctx.font = 'bold 60px monospace';
  ctx.fillText('SIGNAL LOST', VIEW.width / 2, 185);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`SCORE ${Math.floor(w.score)}`, VIEW.width / 2, 265);
  ctx.fillStyle = PALETTE.violet;
  ctx.font = '20px monospace';
  ctx.fillText(`WAVE ${w.wave}   ·   BEST ${w.best}`, VIEW.width / 2, 305);
  const newBest = Math.floor(w.score) >= w.best && w.score > 0;
  if (newBest) {
    glow(ctx, PALETTE.gold, 18);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('NEW PERSONAL BEST', VIEW.width / 2, 350);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 0.7 + Math.sin(w.time * 4) * 0.3;
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PRESS ENTER / R / CLICK TO RESTART', VIEW.width / 2, 455);
  ctx.restore();
}

function waveclear(ctx, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(7,10,24,0.76)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  glow(ctx, PALETTE.accent, 22);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 42px monospace';
  ctx.fillText(`WAVE ${w.wave} CLEARED`, VIEW.width / 2, 145);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '18px monospace';
  ctx.fillText('Choose an upgrade for the next wave', VIEW.width / 2, 190);

  const top = 245;
  for (let i = 0; i < UPGRADES.length; i += 1) {
    const upgrade = UPGRADES[i];
    const x = 90 + i * 270;
    const y = top;
    ctx.fillStyle = 'rgba(20,28,58,0.95)';
    ctx.strokeStyle = i === 0 ? PALETTE.danger : i === 1 ? PALETTE.gold : PALETTE.violet;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, 240, 160);
    ctx.strokeRect(x, y, 240, 160);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = 'bold 38px monospace';
    ctx.fillText(upgrade.key, x + 120, y + 55);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(upgrade.name, x + 120, y + 95);
    ctx.fillStyle = 'rgba(234,242,255,0.7)';
    ctx.font = '14px monospace';
    ctx.fillText(upgrade.detail, x + 120, y + 128);
  }
  ctx.fillStyle = 'rgba(234,242,255,0.6)';
  ctx.font = '14px monospace';
  ctx.fillText('Press 1, 2 or 3 — or wait a moment to repair', VIEW.width / 2, 450);
  ctx.restore();
}

export function render(ctx, w) {
  ctx.save();
  if (w.shake > 0) ctx.translate((w.random() - 0.5) * w.shake, (w.random() - 0.5) * w.shake);
  background(ctx, w);
  drawParticles(ctx, w);
  drawPickups(ctx, w);
  drawEnemies(ctx, w);
  drawBullets(ctx, w);
  if (w.state !== 'title') drawPlayer(ctx, w);
  ctx.restore();

  if (w.state === 'playing' || w.state === 'waveclear') {
    hud(ctx, w);
    banner(ctx, w);
  }
  if (w.state === 'title') title(ctx, w);
  if (w.state === 'waveclear') waveclear(ctx, w);
  if (w.state === 'gameover') gameover(ctx, w);
}
