// Soto Rush — deterministic random numbers (mulberry32) so a screenshot
// scene can be replayed exactly from one seed.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Fisher-Yates shuffle that returns a new array, leaving the input alone.
export function shuffled(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
