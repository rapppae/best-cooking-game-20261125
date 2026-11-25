// Soto Rush — configuration: dishes, ingredients, timings and layout.
// Every value the game tunes lives here so the other files stay logic-only.

export const VIEW = { width: 1280, height: 720 };

// One ingredient bin per entry. `cooks` means it must go through the pot
// before it can join a plate; the rest are ladled or placed straight on.
export const INGREDIENTS = [
  { id: 'broth',   name: 'Kuah Soto',  key: '1', color: '#e8912d', dark: '#b96a12' },
  { id: 'chicken', name: 'Ayam Suwir', key: '2', color: '#f2c14e', dark: '#c08a1e' },
  { id: 'rice',    name: 'Nasi',       key: '3', color: '#f7f3e8', dark: '#cfc7ae', cooks: true },
  { id: 'noodles', name: 'Mie',        key: '4', color: '#f6d365', dark: '#c9a13a', cooks: true },
  { id: 'egg',     name: 'Telur',      key: '5', color: '#fff3c4', dark: '#d9b64a' },
  { id: 'veg',     name: 'Sayur',      key: '6', color: '#7bc96f', dark: '#4a8f3f' },
  { id: 'tea',     name: 'Teh',        key: '7', color: '#c96f2e', dark: '#8a4a16' },
  { id: 'ice',     name: 'Es Batu',    key: '8', color: '#a8d8f0', dark: '#5f9cc4' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// Dishes the warung serves. `recipe` is the exact set of ingredient ids a
// plate must hold, in any order. `price` is the base pay in coins.
export const DISHES = {
  soto: {
    name: 'Soto Ayam', price: 60, color: '#e8912d',
    blurb: 'Kuah hangat, ayam suwir, nasi dan telur.',
    recipe: ['broth', 'chicken', 'rice', 'egg'],
  },
  mie: {
    name: 'Mie Goreng', price: 55, color: '#f6d365',
    blurb: 'Mie goreng telur, ayam dan sayur.',
    recipe: ['noodles', 'egg', 'chicken', 'veg'],
  },
  nasi: {
    name: 'Nasi Goreng', price: 65, color: '#e07840',
    blurb: 'Nasi goreng spesial warung.',
    recipe: ['rice', 'egg', 'chicken', 'veg'],
  },
  esteh: {
    name: 'Es Teh Manis', price: 35, color: '#c96f2e',
    blurb: 'Teh manis dingin, pelepas dahaga.',
    recipe: ['tea', 'ice'],
  },
};

// Which dishes a level unlocks. Level rises as the shift goes on.
export const DISH_POOL = [
  ['soto', 'mie'],
  ['soto', 'mie', 'nasi'],
  ['soto', 'mie', 'nasi', 'esteh'],
];

export const TIMING = {
  shiftSeconds: 150,          // one shift lasts 2.5 minutes
  patienceSeconds: 46,        // how long a customer waits at level 1
  patiencePerLevel: -4,       // seconds lost per level, down to a floor
  patienceFloor: 28,
  cookSeconds: 3,             // noodles / rice in the pot
  orderGapSeconds: 1.2,       // pause before a fresh ticket arrives
  newOrderEverySeconds: 9,    // a new ticket while a slot is free (level 1)
  newOrderPerLevel: -1.2,     // faster with level, down to a floor
  newOrderFloor: 4.5,
  serveFlySeconds: 0.9,       // coins fly to the till
  maxHearts: 3,
  maxCombo: 10,               // combo multiplier caps at x2.0
};

export const SCORE = {
  tipMaxFraction: 0.5,        // up to +50% of the price for a fast serve
  comboStep: 0.1,             // +10% per combo step
  perfectBonus: 15,           // extra coins when patience is over 75%
};

// Layout, in the 1280x720 logical canvas. Everything is drawn from these.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 76, w: 1232, h: 118 },
  ticket: { w: 392, h: 104, gap: 24 },
  pot: { x: 24, y: 210, w: 300, h: 330 },
  plate: { x: 348, y: 210, w: 584, h: 330 },
  serve: { x: 956, y: 210, w: 300, h: 330 },
  bins: { x: 24, y: 556, w: 1232, h: 148 },
  bin: { w: 140, h: 132, gap: 16 },
};
