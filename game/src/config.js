// Neon Bloom - tuning constants. Kept in one place so the rules and the
// difficulty curve are easy to read and easy to change while playtesting.
export const VIEW = { width: 960, height: 600 };

export const PLAYER = {
  radius: 19,
  speed: 275,
  maxHealth: 5,
  fireDelay: 0.15,
  bulletSpeed: 600,
  bulletLife: 1.05,
  invulnerable: 1.1,
};

export const WAVE = {
  first: 5,
  perWave: 2,
  spawnDelay: 0.8,
  maxAlive: 15,
  breakTime: 2.1,
};

export const ENEMY = {
  drifter: { radius: 21, speed: 72, health: 2, score: 100, color: '#ff5c8a' },
  charger: { radius: 17, speed: 165, health: 1, score: 150, color: '#ffd166' },
  splitter: { radius: 27, speed: 52, health: 4, score: 250, color: '#9d7bff' },
  mote: { radius: 11, speed: 118, health: 1, score: 50, color: '#6ef2d0' },
};

export const PICKUP = {
  energy: { color: '#6ef2d0', label: '+' },
  repair: { color: '#ff5c8a', label: '+' },
  overdrive: { color: '#ffd166', label: '*' },
  duration: 8,
};

// The three choices offered between waves. Each is a real trade-off.
export const UPGRADES = [
  { id: 'repair', name: 'Field Repair', detail: 'Restore 2 health', key: '1' },
  { id: 'rapid', name: 'Overclock', detail: 'Fire 35% faster', key: '2' },
  { id: 'spread', name: 'Prism Shot', detail: 'Add two side bolts', key: '3' },
];

export const PALETTE = {
  background: '#070a18',
  grid: '#182040',
  ink: '#eaf2ff',
  accent: '#6ef2d0',
  danger: '#ff5c8a',
  gold: '#ffd166',
  violet: '#9d7bff',
};
