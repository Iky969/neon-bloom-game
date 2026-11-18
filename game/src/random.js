// Small deterministic PRNG. Screenshot runs pass ?seed= so the same moment of
// play can be reproduced exactly; normal play uses a time-based seed.
export function makeRandom(seed = Date.now()) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function range(random, min, max) { return min + random() * (max - min); }
export function pick(random, list) { return list[Math.floor(random() * list.length) % list.length]; }
