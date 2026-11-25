// Soto Rush — customer orders: what a ticket is, how one is made, and how
// its patience drains. Scoring lives in kitchen.js; this file only knows
// the ticket itself.

import { DISHES, TIMING } from './config.js';
import { pick } from './random.js';

let nextOrderId = 1;

export class Order {
  constructor(dishId, patienceSeconds) {
    this.id = nextOrderId++;
    this.dishId = dishId;
    this.dish = DISHES[dishId];
    this.patienceMax = patienceSeconds;
    this.patience = patienceSeconds;
    this.state = 'waiting'; // waiting | served | left
    this.servedAt = 0;      // patience left when served, for the tip
    this.bornAt = 0;
  }

  // Fraction of patience left, 1 = just arrived, 0 = walking out.
  get patienceFrac() {
    return Math.max(0, this.patience / this.patienceMax);
  }

  get expired() {
    return this.patience <= 0;
  }

  update(dt) {
    if (this.state !== 'waiting') return;
    this.patience -= dt;
    if (this.patience <= 0) {
      this.patience = 0;
      this.state = 'left';
    }
  }
}

// A fresh ticket for the current level: a dish from the level's pool.
export function makeOrder(rng, level, now) {
  const pool = ['soto', 'mie', 'nasi', 'esteh'].filter((id) => {
    // Level 1: soto + mie. Level 2 adds nasi. Level 3 adds es teh.
    if (id === 'nasi') return level >= 2;
    if (id === 'esteh') return level >= 3;
    return true;
  });
  const patience = Math.max(
    TIMING.patienceFloor,
    TIMING.patienceSeconds + TIMING.patiencePerLevel * (level - 1),
  );
  const order = new Order(pick(rng, pool), patience);
  order.bornAt = now;
  return order;
}
