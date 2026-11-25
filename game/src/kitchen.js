// Soto Rush — the kitchen: all game state and every player action.
// Rendering lives in render.js; this file only knows the rules.

import { DISHES, INGREDIENT_BY_ID, LAYOUT, SCORE, TIMING } from './config.js';
import { makeOrder } from './orders.js';
import { makeRng, range } from './random.js';
import { Sfx } from './audio.js';

const TICKET_SLOTS = 3;
const POT_SLOTS = 2;

export class Kitchen {
  constructor(seed = 20261125) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.sfx = new Sfx();
    this.reset();
  }

  reset() {
    this.state = 'title'; // title | playing | paused | over
    this.elapsed = 0;
    this.timeLeft = TIMING.shiftSeconds;
    this.level = 1;
    this.coins = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hearts = TIMING.maxHearts;
    this.served = 0;
    this.lost = 0;
    this.slots = Array.from({ length: TICKET_SLOTS }, () => ({ order: null, refill: 0 }));
    this.activeIndex = 0;
    this.plate = []; // ingredient ids on the assembly plate
    this.pot = Array.from({ length: POT_SLOTS }, () => ({ id: null, progress: 0, done: false }));
    this.spawnTimer = 0;
    this.particles = []; // steam, coins, sparks: {kind,x,y,vx,vy,life,maxLife,size,color}
    this.floaters = [];  // floating score text: {x,y,text,color,life}
    this.toasts = [];    // short messages: {text,life}
    this.lastServed = null; // {dishId, life} — the dish resting on the serve counter
    this.serveAnim = 0;  // seconds since the last serve, for the bell ring
    this.shake = 0;      // screen shake on a mistake, decays to 0
    this.hover = null;   // current hover region, set by the input layer
    this.frozen = false; // screenshot mode: time does not pass
  }

  get activeOrder() {
    const slot = this.slots[this.activeIndex];
    return slot && slot.order && slot.order.state === 'waiting' ? slot.order : null;
  }

  get levelName() {
    return ['Pemula', 'Ramai', 'Rush Hour'][this.level - 1] ?? 'Rush Hour';
  }

  // ---- flow ---------------------------------------------------------------

  start() {
    this.reset();
    this.state = 'playing';
    this.sfx.ensure();
    this.spawnOrderIn(0);
    this.spawnOrderIn(1);
    this.activeIndex = 0;
  }

  restart() {
    this.start();
  }

  togglePause() {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  // ---- orders ---------------------------------------------------------------

  spawnOrderIn(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.order) return;
    // Prefer a dish that is not already waiting on another ticket.
    let order = makeOrder(this.rng, this.level, this.elapsed);
    for (let tries = 0; tries < 3; tries++) {
      const dup = this.slots.some(
        (s) => s.order && s.order.state === 'waiting' && s.order.dishId === order.dishId,
      );
      if (!dup) break;
      order = makeOrder(this.rng, this.level, this.elapsed);
    }
    slot.order = order;
    slot.refill = 0;
  }

  refillSlot(slotIndex, delay) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    slot.order = null;
    slot.refill = delay;
  }

  // ---- player actions -------------------------------------------------------

  selectTicket(index) {
    if (this.state !== 'playing') return;
    if (!this.slots[index] || !this.slots[index].order) return;
    if (this.activeIndex !== index) {
      this.activeIndex = index;
      this.sfx.click();
    }
  }

  // Click an ingredient bin. Cooking ingredients go to the pot; the rest go
  // straight onto the plate when the active order needs them.
  addIngredient(id) {
    if (this.state !== 'playing') return;
    const ing = INGREDIENT_BY_ID[id];
    if (!ing) return;
    const order = this.activeOrder;
    if (!order) {
      this.deny('Pilih pesanan dulu!');
      return;
    }
    if (ing.cooks) {
      const free = this.pot.find((s) => s.id === null);
      if (!free) {
        this.deny('Panci penuh!');
        return;
      }
      free.id = id;
      free.progress = 0;
      free.done = false;
      this.sfx.pick();
      return;
    }
    if (!order.dish.recipe.includes(id)) {
      this.deny(`${ing.name} tidak dipesan`);
      return;
    }
    if (this.plate.includes(id)) {
      this.deny('Sudah ada di piring');
      return;
    }
    this.plate.push(id);
    this.sfx.place();
    this.spawnSteam(this.plateCenter().x, this.plateCenter().y - 30, 3);
  }

  // Click a finished pot slot: move the cooked item onto the plate.
  takeFromPot(slotIndex) {
    if (this.state !== 'playing') return;
    const slot = this.pot[slotIndex];
    if (!slot || !slot.done || !slot.id) return;
    const order = this.activeOrder;
    if (!order) {
      this.deny('Pilih pesanan dulu!');
      return;
    }
    if (!order.dish.recipe.includes(slot.id)) {
      this.deny(`${INGREDIENT_BY_ID[slot.id].name} tidak dipesan`);
      return;
    }
    if (this.plate.includes(slot.id)) {
      this.deny('Sudah ada di piring');
      return;
    }
    this.plate.push(slot.id);
    slot.id = null;
    slot.progress = 0;
    slot.done = false;
    this.sfx.place();
  }

  // Click a filled plate slot to take that item off again.
  removeFromPlate(index) {
    if (this.state !== 'playing') return;
    if (index < 0 || index >= this.plate.length) return;
    this.plate.splice(index, 1);
    this.sfx.click();
  }

  clearPlate() {
    if (this.state !== 'playing' || this.plate.length === 0) return;
    this.plate = [];
    this.sfx.click();
  }

  plateComplete() {
    const order = this.activeOrder;
    if (!order) return false;
    const recipe = order.dish.recipe;
    return recipe.length === this.plate.length && recipe.every((id) => this.plate.includes(id));
  }

  serve() {
    if (this.state !== 'playing') return;
    const order = this.activeOrder;
    if (!order) return;
    if (!this.plateComplete()) {
      this.deny('Piring belum lengkap!');
      return;
    }
    const patienceFrac = order.patienceFrac;
    const base = order.dish.price;
    const tip = Math.round(base * SCORE.tipMaxFraction * patienceFrac);
    const perfect = patienceFrac > 0.75 ? SCORE.perfectBonus : 0;
    const multiplier = 1 + Math.min(this.combo, TIMING.maxCombo) * SCORE.comboStep;
    const total = Math.round((base + tip + perfect) * multiplier);
    this.coins += total;
    this.score += total;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    order.state = 'served';
    order.servedAt = patienceFrac;
    this.lastServed = { dishId: order.dishId, life: 3 };
    this.serveAnim = 0.001;
    const c = this.serveCenter();
    this.spawnCoins(c.x, c.y, 10);
    const label = perfect > 0 ? `PERFECT +${total}` : `+${total} koin`;
    this.floaters.push({ x: c.x, y: c.y - 40, text: label, color: '#ffd94a', life: 1.4 });
    if (this.combo >= 3) {
      this.floaters.push({ x: c.x, y: c.y - 80, text: `KOMBO x${this.combo}!`, color: '#ff9d5c', life: 1.4 });
    }
    this.sfx.serve();
    this.sfx.coin();
    this.plate = [];
    const servedIndex = this.activeIndex;
    this.refillSlot(servedIndex, TIMING.orderGapSeconds);
    // Keep the spotlight on a ticket that is still waiting.
    const next = this.slots.findIndex((s) => s.order && s.order.state === 'waiting');
    if (next >= 0) this.activeIndex = next;
  }

  deny(message) {
    this.toasts.push({ text: message, life: 1.1 });
    this.shake = 5;
    this.sfx.error();
  }

  // ---- per-frame update -----------------------------------------------------

  update(dt) {
    if (this.frozen || this.state !== 'playing') {
      this.updateFx(dt);
      return;
    }
    this.elapsed += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'over';
      this.sfx.ding();
    }
    const level = Math.min(3, 1 + Math.floor(this.elapsed / 45));
    if (level !== this.level) {
      this.level = level;
      this.toasts.push({ text: `Level ${level} — ${this.levelName}! Pesanan makin cepat!`, life: 2 });
      this.sfx.levelUp();
    }
    // Orders: patience, expiry, refills, new arrivals.
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.order && slot.order.state === 'waiting') {
        slot.order.update(dt);
        if (slot.order.state === 'left') {
          this.lost += 1;
          this.hearts -= 1;
          this.combo = 0;
          this.sfx.leave();
          this.floaters.push({ x: 220 + i * 416, y: 150, text: 'Pelanggan pergi!', color: '#ff6b5e', life: 1.4 });
          if (this.hearts <= 0) {
            this.state = 'over';
            this.sfx.ding();
          }
          this.refillSlot(i, TIMING.orderGapSeconds);
        }
      } else if (!slot.order && slot.refill > 0) {
        slot.refill -= dt;
        if (slot.refill <= 0) this.spawnOrderIn(i);
      }
    }
    // New tickets while a slot is free.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const free = this.slots.findIndex((s) => !s.order && s.refill <= 0);
      if (free >= 0) {
        this.spawnOrderIn(free);
        const gap = Math.max(
          TIMING.newOrderFloor,
          TIMING.newOrderEverySeconds + TIMING.newOrderPerLevel * (this.level - 1),
        );
        this.spawnTimer = gap;
      } else {
        this.spawnTimer = 1;
      }
    }
    // The pot cooks.
    for (const slot of this.pot) {
      if (slot.id && !slot.done) {
        slot.progress += dt / TIMING.cookSeconds;
        if (slot.progress >= 1) {
          slot.progress = 1;
          slot.done = true;
          this.sfx.ding();
        }
      }
    }
    if (this.lastServed) {
      this.lastServed.life -= dt;
      if (this.lastServed.life <= 0) this.lastServed = null;
    }
    if (this.serveAnim > 0) this.serveAnim += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 18);
    this.updateFx(dt);
    // A wisp of steam from the broth cauldron, now and then.
    if (this.rng() < dt * 6) {
      this.spawnSteam(174 + range(this.rng, -20, 20), 478, 1);
    }
  }

  updateFx(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= p.kind === 'coin' ? 320 * dt : 0;
      if (p.kind === 'steam') p.size += dt * 14;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.life -= dt;
      f.y -= 34 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);
  }

  spawnSteam(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        kind: 'steam', x: x + range(this.rng, -14, 14), y: y + range(this.rng, -4, 4),
        vx: range(this.rng, -6, 6), vy: range(this.rng, -46, -28),
        life: range(this.rng, 0.7, 1.2), maxLife: 1.2, size: range(this.rng, 6, 10), color: '255,255,255',
      });
    }
  }

  spawnCoins(x, y, n) {
    for (let i = 0; i < n; i++) {
      const angle = range(this.rng, -Math.PI * 0.85, -Math.PI * 0.15);
      const speed = range(this.rng, 180, 320);
      this.particles.push({
        kind: 'coin', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: range(this.rng, 0.6, 1.0), maxLife: 1.0, size: range(this.rng, 5, 8), color: '255,217,74',
      });
    }
  }

  // ---- geometry helpers for the renderer ------------------------------------

  plateCenter() {
    const p = LAYOUT.plate;
    return { x: p.x + p.w / 2, y: p.y + p.h / 2 + 10 };
  }

  serveCenter() {
    const s = LAYOUT.serve;
    return { x: s.x + 190, y: s.y + 90 };
  }

  ticketRect(index) {
    const b = LAYOUT.board;
    const t = LAYOUT.ticket;
    return { x: b.x + index * (t.w + t.gap), y: b.y + 6, w: t.w, h: t.h };
  }

  binRect(index) {
    const b = LAYOUT.bins;
    const bin = LAYOUT.bin;
    return { x: b.x + index * (bin.w + bin.gap), y: b.y + 8, w: bin.w, h: bin.h };
  }

  potSlotRect(index) {
    const p = LAYOUT.pot;
    return { x: p.x + 28 + index * 132, y: p.y + 96, w: 116, h: 116 };
  }

  plateSlotRect(index, total) {
    const c = this.plateCenter();
    const r = 100;
    const angle = -Math.PI / 2 + (index / Math.max(1, total)) * Math.PI * 2;
    return { x: c.x + Math.cos(angle) * r - 30, y: c.y + Math.sin(angle) * r - 30, w: 60, h: 60 };
  }

  // Where each item on the plate is drawn (and clickable). Items that belong
  // to the active order sit on their recipe ring position; extras go after.
  // The renderer and the hit test both use this, so they can never disagree.
  plateItemRects() {
    const order = this.activeOrder;
    const recipe = order ? order.dish.recipe : [];
    const total = Math.max(recipe.length, this.plate.length, 1);
    let extraSeen = 0;
    return this.plate.map((id) => {
      let pos = recipe.indexOf(id);
      if (pos < 0) {
        pos = recipe.length + extraSeen;
        extraSeen += 1;
      }
      return { id, rect: this.plateSlotRect(pos, total), inRecipe: recipe.includes(id) };
    });
  }

  // Ghost rings for recipe slots the plate does not hold yet.
  plateGhostRects() {
    const order = this.activeOrder;
    if (!order) return [];
    const recipe = order.dish.recipe;
    const total = Math.max(recipe.length, this.plate.length, 1);
    return recipe
      .filter((id) => !this.plate.includes(id))
      .map((id) => ({ id, rect: this.plateSlotRect(recipe.indexOf(id), total) }));
  }

  serveButtonRect() {
    const s = LAYOUT.serve;
    return { x: s.x + 30, y: s.y + 252, w: s.w - 60, h: 52 };
  }

  clearButtonRect() {
    const p = LAYOUT.plate;
    return { x: p.x + p.w - 118, y: p.y + 14, w: 104, h: 34 };
  }

  // ---- hit testing (used by the input layer) ---------------------------------

  hitTest(x, y) {
    const inside = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    // Top bar buttons.
    if (y < LAYOUT.topBar.h) {
      if (x > 1180 && x < 1224) return { kind: 'mute' };
      if (x > 1228 && x < 1272) return { kind: 'pause' };
      return { kind: 'none' };
    }
    if (this.state === 'title') {
      if (x > 490 && x < 790 && y > 520 && y < 580) return { kind: 'start' };
      return { kind: 'none' };
    }
    if (this.state === 'over') {
      if (x > 490 && x < 790 && y > 520 && y < 580) return { kind: 'restart' };
      return { kind: 'none' };
    }
    // Tickets.
    for (let i = 0; i < TICKET_SLOTS; i++) {
      if (inside(this.ticketRect(i))) return { kind: 'ticket', index: i };
    }
    // Serve + clear buttons.
    if (inside(this.serveButtonRect())) return { kind: 'serve' };
    if (inside(this.clearButtonRect())) return { kind: 'clear' };
    // Pot slots (the cooked item you take).
    for (let i = 0; i < POT_SLOTS; i++) {
      if (inside(this.potSlotRect(i))) return { kind: 'pot', index: i };
    }
    // Filled plate slots (click to remove that item).
    for (const [i, item] of this.plateItemRects().entries()) {
      if (inside(item.rect)) return { kind: 'plateSlot', index: i };
    }
    // Ingredient bins.
    for (let i = 0; i < 8; i++) {
      if (inside(this.binRect(i))) return { kind: 'bin', index: i };
    }
    return { kind: 'none' };
  }

  act(region) {
    switch (region.kind) {
      case 'start': this.start(); break;
      case 'restart': this.restart(); break;
      case 'mute': this.sfx.ensure(); this.sfx.toggleMute(); break;
      case 'pause': this.togglePause(); break;
      case 'ticket': this.selectTicket(region.index); break;
      case 'bin': this.addIngredient(INGREDIENTS[region.index].id); break;
      case 'pot': this.takeFromPot(region.index); break;
      case 'plateSlot': this.removeFromPlate(region.index); break;
      case 'serve': this.serve(); break;
      case 'clear': this.clearPlate(); break;
      default: break;
    }
  }

  // ---- screenshot scenes ------------------------------------------------------

  // Set up one frozen, deterministic scene for a screenshot. The caller
  // runs update() a few dozen times to settle particles, then renders once.
  setupShot(name, seed = 7) {
    this.rng = makeRng(seed);
    this.reset();
    this.state = 'playing';
    this.frozen = true;
    const mk = (dishId, patience, frac) => {
      const o = makeOrder(this.rng, 2, 0);
      o.dishId = dishId;
      o.dish = DISHES[dishId];
      o.patienceMax = patience;
      o.patience = patience * frac;
      o.state = 'waiting';
      return o;
    };
    if (name === 'cover') {
      this.coins = 340; this.score = 340; this.combo = 3; this.bestCombo = 5;
      this.level = 2; this.timeLeft = 72; this.elapsed = 78;
      this.slots[0].order = mk('soto', 46, 0.62);
      this.slots[1].order = mk('mie', 46, 0.34);
      this.slots[2].order = mk('nasi', 46, 0.8);
      this.activeIndex = 0;
      this.plate = ['broth', 'chicken', 'egg'];
      this.pot[0] = { id: 'rice', progress: 0.62, done: false };
      this.pot[1] = { id: 'noodles', progress: 1, done: true };
      this.lastServed = { dishId: 'nasi', life: 3 };
      this.spawnSteam(90, 300, 6);
      this.spawnSteam(640, 330, 4);
    } else if (name === 'rush') {
      this.coins = 520; this.score = 520; this.combo = 5; this.bestCombo = 6;
      this.level = 3; this.timeLeft = 45; this.elapsed = 105;
      this.slots[0].order = mk('mie', 38, 0.1);
      this.slots[1].order = mk('soto', 38, 0.42);
      this.slots[2].order = mk('esteh', 38, 0.7);
      this.activeIndex = 0;
      this.plate = ['egg'];
      this.pot[0] = { id: 'noodles', progress: 0.85, done: false };
      this.pot[1] = { id: 'rice', progress: 0.4, done: false };
      this.spawnSteam(90, 300, 8);
      this.spawnSteam(640, 330, 5);
    } else if (name === 'serve') {
      this.coins = 615; this.score = 615; this.combo = 4; this.bestCombo = 6;
      this.level = 2; this.timeLeft = 96; this.elapsed = 54;
      this.slots[0].order = mk('soto', 46, 0.55);
      this.slots[1].order = mk('nasi', 46, 0.72);
      this.slots[2].order = mk('mie', 46, 0.28);
      this.activeIndex = 0;
      this.plate = ['broth', 'chicken', 'rice', 'egg'];
      this.pot[0] = { id: null, progress: 0, done: false };
      this.pot[1] = { id: 'noodles', progress: 1, done: true };
      const c = this.serveCenter();
      this.spawnCoins(c.x, c.y, 10);
      this.floaters.push({ x: c.x, y: c.y - 40, text: 'PERFECT +132', color: '#ffd94a', life: 1.4 });
      this.floaters.push({ x: c.x, y: c.y - 80, text: 'KOMBO x4!', color: '#ff9d5c', life: 1.4 });
      this.serveAnim = 0.3;
    } else {
      // combo: a big combo, a full board, one plate complete and ready.
      this.coins = 890; this.score = 890; this.combo = 6; this.bestCombo = 8;
      this.level = 3; this.timeLeft = 96; this.elapsed = 96;
      this.slots[0].order = mk('nasi', 38, 0.66);
      this.slots[1].order = mk('soto', 38, 0.5);
      this.slots[2].order = mk('esteh', 38, 0.9);
      this.activeIndex = 0;
      this.plate = ['rice', 'egg', 'chicken', 'veg'];
      this.pot[0] = { id: 'noodles', progress: 0.3, done: false };
      this.pot[1] = { id: null, progress: 0, done: false };
      this.spawnSteam(90, 300, 5);
    }
  }
}
