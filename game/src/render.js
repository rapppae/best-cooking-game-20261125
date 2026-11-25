// Soto Rush — everything the player sees, drawn on one canvas.
// This file only reads state from the kitchen; it never changes the rules.

import { DISHES, INGREDIENTS, INGREDIENT_BY_ID, LAYOUT, TIMING } from './config.js';

const FONT = `'Trebuchet MS', 'Segoe UI', sans-serif`;

// --- small helpers -----------------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function textOutline(ctx, str, x, y, size, color, outline = 'rgba(60,30,5,0.85)', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- food icons --------------------------------------------------------------

// Draw one ingredient as a small picture, centred on (x, y), radius r.
export function drawIngredient(ctx, id, x, y, r) {
  const ing = INGREDIENT_BY_ID[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'broth': {
      // A bowl of orange broth with a wavy surface.
      circle(ctx, 0, 2, r);
      ctx.fillStyle = ing.color; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = ing.dark; ctx.stroke();
      ctx.strokeStyle = '#f7c46a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.1);
      ctx.quadraticCurveTo(0, -r * 0.35, r * 0.55, -r * 0.1);
      ctx.moveTo(-r * 0.5, r * 0.25);
      ctx.quadraticCurveTo(0, r * 0.05, r * 0.5, r * 0.25);
      ctx.stroke();
      break;
    }
    case 'chicken': {
      // A drumstick: brown meat + white bone.
      ctx.rotate(-0.6);
      ctx.fillStyle = '#c98a3d';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8b06a';
      ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.1, r * 0.5, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(r * 0.55, -r * 0.16, r * 0.45, r * 0.32);
      circle(ctx, r * 1.05, -r * 0.22, r * 0.2); ctx.fill();
      circle(ctx, r * 1.05, r * 0.22, r * 0.2); ctx.fill();
      break;
    }
    case 'rice': {
      // A dome of white rice.
      ctx.fillStyle = '#fdfaf0';
      ctx.beginPath(); ctx.arc(0, r * 0.35, r * 0.9, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8dfc4';
      ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.9, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cfc7ae';
      for (const [gx, gy] of [[-0.4, -0.25], [0.1, -0.45], [0.45, -0.15], [-0.05, 0.05]]) {
        ctx.beginPath(); ctx.ellipse(gx * r, gy * r, r * 0.14, r * 0.07, 0.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'noodles': {
      // A nest of wavy yellow noodles.
      ctx.fillStyle = '#f6d365';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, i * r * 0.32);
        ctx.bezierCurveTo(-r * 0.3, i * r * 0.32 - r * 0.3, r * 0.3, i * r * 0.32 + r * 0.3, r * 0.7, i * r * 0.32);
        ctx.stroke();
      }
      break;
    }
    case 'egg': {
      // A fried egg: wobbly white, golden yolk.
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const wob = r * (0.85 + 0.15 * Math.sin(a * 3));
        const px = Math.cos(a) * wob;
        const py = Math.sin(a) * wob * 0.85;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2a93b';
      circle(ctx, 0, 0, r * 0.45); ctx.fill();
      ctx.fillStyle = '#ffd76a';
      circle(ctx, -r * 0.1, -r * 0.1, r * 0.22); ctx.fill();
      break;
    }
    case 'veg': {
      // Green leaves and two carrot sticks.
      ctx.fillStyle = '#7bc96f';
      for (const a of [-0.7, 0, 0.7]) {
        ctx.save(); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.35, r * 0.32, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#e07840';
      ctx.save(); ctx.rotate(0.5); ctx.fillRect(-r * 0.55, r * 0.15, r * 0.9, r * 0.22); ctx.restore();
      ctx.save(); ctx.rotate(-0.4); ctx.fillRect(-r * 0.2, r * 0.3, r * 0.9, r * 0.22); ctx.restore();
      break;
    }
    case 'tea': {
      // A glass of amber tea with a tea-bag string.
      ctx.fillStyle = 'rgba(201,111,46,0.9)';
      rr(ctx, -r * 0.55, -r * 0.8, r * 1.1, r * 1.6, r * 0.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-r * 0.4, -r * 0.65, r * 0.18, r * 1.3);
      ctx.strokeStyle = '#8a4a16'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.8); ctx.lineTo(r * 0.55, -r * 1.1); ctx.stroke();
      ctx.fillStyle = '#f2e3c6';
      rr(ctx, r * 0.42, -r * 1.28, r * 0.3, r * 0.24, 3); ctx.fill();
      break;
    }
    case 'ice': {
      // Two blue ice cubes.
      ctx.fillStyle = 'rgba(168,216,240,0.95)';
      ctx.strokeStyle = '#5f9cc4'; ctx.lineWidth = 2;
      ctx.save(); ctx.translate(-r * 0.25, r * 0.1); ctx.rotate(0.3);
      ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9); ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
      ctx.restore();
      ctx.save(); ctx.translate(r * 0.35, -r * 0.25); ctx.rotate(-0.25);
      ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8); ctx.strokeRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
      ctx.restore();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// A finished dish as one picture: a plate or bowl holding its ingredients.
export function drawDish(ctx, dishId, x, y, r) {
  const dish = DISHES[dishId];
  if (!dish) return;
  ctx.save();
  ctx.translate(x, y);
  if (dishId === 'esteh') {
    drawIngredient(ctx, 'tea', -r * 0.15, 0, r * 0.7);
    drawIngredient(ctx, 'ice', r * 0.35, -r * 0.45, r * 0.4);
    ctx.restore();
    return;
  }
  // Plate.
  circle(ctx, 0, 0, r);
  ctx.fillStyle = '#fffdf6'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#d9c9a8'; ctx.stroke();
  circle(ctx, 0, 0, r * 0.72);
  ctx.fillStyle = dishId === 'soto' ? '#f2a93b' : dishId === 'mie' ? '#f6d365' : '#e07840';
  ctx.fill();
  if (dishId === 'soto') {
    drawIngredient(ctx, 'chicken', -r * 0.25, -r * 0.05, r * 0.32);
    drawIngredient(ctx, 'egg', r * 0.3, r * 0.15, r * 0.3);
    drawIngredient(ctx, 'rice', r * 0.05, -r * 0.35, r * 0.28);
  } else if (dishId === 'mie') {
    drawIngredient(ctx, 'noodles', 0, -r * 0.05, r * 0.5);
    drawIngredient(ctx, 'egg', r * 0.3, r * 0.25, r * 0.26);
    drawIngredient(ctx, 'veg', -r * 0.35, r * 0.2, r * 0.26);
  } else {
    drawIngredient(ctx, 'rice', 0, 0, r * 0.5);
    drawIngredient(ctx, 'egg', r * 0.3, -r * 0.25, r * 0.26);
    drawIngredient(ctx, 'chicken', -r * 0.3, r * 0.2, r * 0.26);
  }
  ctx.restore();
}

function drawCoin(ctx, x, y, r) {
  circle(ctx, x, y, r);
  ctx.fillStyle = '#ffd94a'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#c08a1e'; ctx.stroke();
  text(ctx, 'Rp', x, y + 1, Math.round(r * 0.85), '#a86f00');
}

function drawHeart(ctx, x, y, r, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#ff5b4d' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.6, -r * 0.9, 0, -r * 0.25);
  ctx.bezierCurveTo(r * 0.6, -r * 0.9, r * 1.2, -r * 0.1, 0, r * 0.7);
  ctx.fill();
  ctx.restore();
}

function drawFace(ctx, x, y, r, mood) {
  // mood: 0 happy, 1 worried, 2 angry — driven by patience.
  circle(ctx, x, y, r);
  ctx.fillStyle = '#ffd9a8'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#c08a5e'; ctx.stroke();
  ctx.fillStyle = '#3a2410';
  circle(ctx, x - r * 0.35, y - r * 0.2, r * 0.12); ctx.fill();
  circle(ctx, x + r * 0.35, y - r * 0.2, r * 0.12); ctx.fill();
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 0) {
    ctx.arc(x, y + r * 0.15, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 1) {
    ctx.arc(x, y + r * 0.65, r * 0.35, 1.15 * Math.PI, 1.85 * Math.PI);
  } else {
    ctx.moveTo(x - r * 0.4, y + r * 0.5);
    ctx.lineTo(x + r * 0.4, y + r * 0.5);
  }
  ctx.stroke();
  if (mood === 2) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.55); ctx.lineTo(x - r * 0.15, y - r * 0.35);
    ctx.moveTo(x + r * 0.55, y - r * 0.55); ctx.lineTo(x + r * 0.15, y - r * 0.35);
    ctx.stroke();
  }
}

// --- screens -------------------------------------------------------------------

function drawBackground(ctx) {
  // Warm warung wall, tiled floor, and a striped awning at the top.
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#f7e8c9');
  g.addColorStop(0.55, '#f3dcae');
  g.addColorStop(1, '#e8c98f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  // Wall tiles.
  ctx.strokeStyle = 'rgba(180,140,80,0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1280; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 560); ctx.stroke();
  }
  for (let y = 140; y < 560; y += 70) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
  }
  // Awning stripes.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d9483b' : '#fff8e7';
    ctx.fillRect(i * 80, 0, 80, 64);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 58, 1280, 6);
}

function drawTopBar(k, ctx) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(bar.x, bar.y + bar.h - 5, bar.w, 5);
  text(ctx, 'SOTO RUSH', 24, 34, 30, '#ffd94a', 'bold', 'left');
  text(ctx, 'Warung Soto Express', 210, 36, 15, '#f7e8c9', 'normal', 'left');
  // Shift timer, centre.
  const low = k.timeLeft < 30 && k.state === 'playing';
  const timerBg = low ? '#d9483b' : 'rgba(255,255,255,0.14)';
  rr(ctx, 540, 10, 200, 44, 10);
  ctx.fillStyle = timerBg; ctx.fill();
  text(ctx, `WAKTU ${formatTime(k.timeLeft)}`, 640, 33, 22, '#fff8e7');
  // Coins.
  drawCoin(ctx, 800, 32, 16);
  text(ctx, `${k.coins}`, 824, 33, 24, '#ffd94a', 'bold', 'left');
  // Combo badge.
  if (k.combo >= 2) {
    rr(ctx, 920, 12, 96, 40, 10);
    ctx.fillStyle = '#ff9d5c'; ctx.fill();
    text(ctx, `KOMBO x${k.combo}`, 968, 33, 17, '#fff8e7');
  }
  // Hearts.
  for (let i = 0; i < TIMING.maxHearts; i++) {
    drawHeart(ctx, 1050 + i * 32, 32, 12, i < k.hearts);
  }
  // Level.
  text(ctx, `Lv ${k.level}`, 1150, 33, 18, '#f7e8c9');
  // Mute / pause buttons.
  rr(ctx, 1180, 12, 44, 40, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
  text(ctx, k.sfx.muted ? '✕' : '♪', 1202, 33, 20, '#fff8e7');
  rr(ctx, 1228, 12, 44, 40, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
  ctx.fillStyle = '#fff8e7';
  if (k.state === 'paused') {
    ctx.beginPath();
    ctx.moveTo(1242, 20); ctx.lineTo(1242, 44); ctx.lineTo(1262, 32); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillRect(1242, 20, 5, 24);
    ctx.fillRect(1251, 20, 5, 24);
  }
}

function drawBoard(k, ctx) {
  const b = LAYOUT.board;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#2e4a3a'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#1d3327'; ctx.stroke();
  text(ctx, 'PESANAN', b.x + 16, b.y + 20, 13, '#9fc7a8', 'bold', 'left');
  for (let i = 0; i < k.slots.length; i++) {
    drawTicket(k, ctx, i);
  }
}

function drawTicket(k, ctx, index) {
  const slot = k.slots[index];
  const r = k.ticketRect(index);
  const active = k.activeIndex === index && slot.order && slot.order.state === 'waiting';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = slot.order ? '#fff8e7' : 'rgba(255,248,231,0.35)';
  ctx.fill();
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeStyle = active ? '#ffd94a' : '#d9c9a8';
  ctx.stroke();
  if (!slot.order) {
    text(ctx, slot.refill > 0 ? 'Pelanggan baru datang…' : '—', r.x + r.w / 2, r.y + r.h / 2, 16, '#8a7a5e', 'normal');
    return;
  }
  const order = slot.order;
  if (order.state === 'served') {
    text(ctx, '✓ Disajikan!', r.x + r.w / 2, r.y + r.h / 2, 20, '#4a8f3f');
    return;
  }
  // Customer face + dish.
  const mood = order.patienceFrac > 0.5 ? 0 : order.patienceFrac > 0.2 ? 1 : 2;
  drawFace(ctx, r.x + 34, r.y + 32, 20, mood);
  drawDish(ctx, order.dishId, r.x + 88, r.y + 34, 26);
  text(ctx, order.dish.name, r.x + 124, r.y + 26, 19, '#3a2410', 'bold', 'left');
  text(ctx, `${order.dish.price} koin`, r.x + 124, r.y + 50, 14, '#8a6a2e', 'normal', 'left');
  // Recipe icons, ticked when already on the plate (active order only).
  const recipe = order.dish.recipe;
  recipe.forEach((id, j) => {
    const ix = r.x + 130 + j * 34;
    const iy = r.y + 80;
    const done = active && k.plate.includes(id);
    ctx.globalAlpha = done ? 1 : 0.85;
    drawIngredient(ctx, id, ix, iy, 12);
    ctx.globalAlpha = 1;
    if (done) {
      circle(ctx, ix + 10, iy - 10, 8);
      ctx.fillStyle = '#4a8f3f'; ctx.fill();
      text(ctx, '✓', ix + 10, iy - 9, 11, '#fff');
    }
  });
  // Patience bar.
  const barX = r.x + 250;
  const barY = r.y + 72;
  const barW = 126;
  rr(ctx, barX, barY, barW, 14, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  const frac = order.patienceFrac;
  const barColor = frac > 0.5 ? '#7bc96f' : frac > 0.2 ? '#f2c14e' : '#ff5b4d';
  if (frac > 0) {
    rr(ctx, barX, barY, Math.max(14, barW * frac), 14, 7);
    ctx.fillStyle = barColor; ctx.fill();
  }
  text(ctx, `${Math.ceil(order.patience)} dtk`, barX + barW / 2, barY + 7, 11, '#3a2410');
}

function drawPotArea(k, ctx) {
  const p = LAYOUT.pot;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = '#8a5a2b'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
  text(ctx, 'KOMPOR', p.x + p.w / 2, p.y + 22, 16, '#f7e8c9');
  // Stove top.
  rr(ctx, p.x + 20, p.y + 40, p.w - 40, 200, 10);
  ctx.fillStyle = '#3a3a3a'; ctx.fill();
  for (let i = 0; i < 2; i++) {
    const slot = k.pot[i];
    const s = k.potSlotRect(i);
    // Burner.
    circle(ctx, s.x + s.w / 2, s.y + s.h / 2 + 6, 52);
    ctx.fillStyle = '#222'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#555'; ctx.stroke();
    // Pot body.
    rr(ctx, s.x + 8, s.y + 6, s.w - 16, 92, 12);
    ctx.fillStyle = slot.id ? '#b8c4cc' : '#8a979e';
    ctx.fill();
    ctx.lineWidth = slot.done ? 4 : 2;
    ctx.strokeStyle = slot.done ? '#ffd94a' : '#6a767d';
    ctx.stroke();
    // Pot handles.
    ctx.fillStyle = '#6a767d';
    ctx.fillRect(s.x - 2, s.y + 26, 12, 10);
    ctx.fillRect(s.x + s.w - 10, s.y + 26, 12, 10);
    if (slot.id) {
      const ing = INGREDIENT_BY_ID[slot.id];
      // Contents bubble in the pot.
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + 42, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
      if (slot.done) {
        text(ctx, 'MATANG! Klik untuk ambil', s.x + s.w / 2, s.y + 118, 12, '#ffd94a');
      } else {
        // Progress bar under the pot.
        rr(ctx, s.x + 8, s.y + 102, s.w - 16, 9, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
        rr(ctx, s.x + 8, s.y + 102, Math.max(9, (s.w - 16) * slot.progress), 9, 4);
        ctx.fillStyle = '#ffd94a'; ctx.fill();
        text(ctx, `${ing.name} ${Math.round(slot.progress * 100)}%`, s.x + s.w / 2, s.y + 122, 12, '#f7e8c9');
      }
    } else {
      text(ctx, 'Panci kosong', s.x + s.w / 2, s.y + 118, 12, '#c9b18a');
    }
  }
  // The big broth cauldron, always simmering.
  circle(ctx, p.x + 150, p.y + 292, 34);
  ctx.fillStyle = '#5e3a17'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(p.x + 150, p.y + 288, 26, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8912d'; ctx.fill();
  text(ctx, 'Kuah soto mendidih', p.x + 150, p.y + 318, 12, '#f7e8c9');
}

function drawPlateArea(k, ctx) {
  const p = LAYOUT.plate;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = '#a06a35'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
  const order = k.activeOrder;
  text(ctx, order ? `Merakit: ${order.dish.name}` : 'Pilih pesanan di papan atas', p.x + 24, p.y + 24, 16, '#f7e8c9', 'bold', 'left');
  // Clear button.
  const cb = k.clearButtonRect();
  rr(ctx, cb.x, cb.y, cb.w, cb.h, 8);
  ctx.fillStyle = k.plate.length ? '#d9483b' : 'rgba(255,255,255,0.2)';
  ctx.fill();
  text(ctx, '✕ Bersihkan', cb.x + cb.w / 2, cb.y + cb.h / 2 + 1, 13, '#fff8e7');
  // The big plate.
  const c = k.plateCenter();
  const complete = k.plateComplete();
  if (complete) {
    circle(ctx, c.x, c.y, 132);
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffd94a'; ctx.stroke();
  }
  circle(ctx, c.x, c.y, 122);
  ctx.fillStyle = '#fffdf6'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#d9c9a8'; ctx.stroke();
  circle(ctx, c.x, c.y, 96);
  ctx.fillStyle = '#f7f0dc'; ctx.fill();
  // Ghost rings for missing recipe items.
  for (const g of k.plateGhostRects()) {
    circle(ctx, g.rect.x + 30, g.rect.y + 30, 30);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2; ctx.strokeStyle = '#b09a6e'; ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.45;
    drawIngredient(ctx, g.id, g.rect.x + 30, g.rect.y + 30, 20);
    ctx.globalAlpha = 1;
  }
  // Items on the plate.
  for (const item of k.plateItemRects()) {
    const cx = item.rect.x + 30;
    const cy = item.rect.y + 30;
    if (!item.inRecipe) {
      circle(ctx, cx, cy, 30);
      ctx.lineWidth = 3; ctx.strokeStyle = '#d9483b'; ctx.stroke();
    }
    drawIngredient(ctx, item.id, cx, cy, 22);
  }
  // Dish picture in the middle when the plate is complete.
  if (complete && order) {
    drawDish(ctx, order.dishId, c.x, c.y, 46);
    textOutline(ctx, 'SIAP DISAJIKAN!', c.x, p.y + p.h - 16, 20, '#ffd94a');
  } else if (order) {
    const got = k.plate.length;
    const need = order.dish.recipe.length;
    text(ctx, `${got}/${need} bahan di piring — klik bahan di bawah`, c.x, p.y + p.h - 16, 14, '#f7e8c9');
  }
}

function drawServeArea(k, ctx) {
  const s = LAYOUT.serve;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = '#7a4a22'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
  text(ctx, 'MEJA SAJI', s.x + 16, s.y + 22, 16, '#f7e8c9', 'bold', 'left');
  const c = k.serveCenter();
  // Service bell, left.
  const bellX = s.x + 56;
  const bellY = s.y + 90;
  circle(ctx, bellX, bellY, 24);
  ctx.fillStyle = '#ffd94a'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#c08a1e'; ctx.stroke();
  ctx.fillStyle = '#c08a1e';
  ctx.fillRect(bellX - 3, bellY + 22, 6, 8);
  circle(ctx, bellX, bellY + 32, 5); ctx.fill();
  text(ctx, 'Bel', bellX, bellY + 50, 12, '#f7e8c9');
  // The last served dish rests on the counter, right.
  if (k.lastServed) {
    drawDish(ctx, k.lastServed.dishId, c.x, c.y, 42);
    text(ctx, DISHES[k.lastServed.dishId].name, c.x, c.y + 62, 14, '#fff8e7');
  } else {
    text(ctx, 'Belum ada hidangan', c.x, c.y, 14, '#e8c98f');
  }
  // Counter shelf under the bell and dish.
  rr(ctx, s.x + 20, s.y + 168, s.w - 40, 24, 8);
  ctx.fillStyle = '#c98d4e'; ctx.fill();
  text(ctx, 'Klik ANTAR saat piring lengkap', s.x + s.w / 2, s.y + 214, 12, '#e8c98f');
  // Serve button.
  const b = k.serveButtonRect();
  const ready = k.plateComplete();
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = ready ? '#4a8f3f' : 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = ready ? '#2f6b28' : 'rgba(255,255,255,0.3)'; ctx.stroke();
  text(ctx, ready ? 'ANTAR!' : 'ANTAR', b.x + b.w / 2, b.y + b.h / 2 + 1, 22, ready ? '#fff' : '#e8c98f');
  if (ready) {
    text(ctx, 'Piring lengkap — klik untuk antar!', b.x + b.w / 2, b.y + b.h + 20, 13, '#ffd94a');
  }
}

function drawBins(k, ctx) {
  const b = LAYOUT.bins;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#8a5a2b'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
  text(ctx, 'BAHAN — klik untuk menambah ke piring (Mie & Nasi dimasak dulu di kompor)', b.x + 16, b.y + 18, 13, '#f7e8c9', 'bold', 'left');
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i];
    const r = k.binRect(i);
    const hovered = k.hover && k.hover.kind === 'bin' && k.hover.index === i;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = hovered ? '#c98d4e' : '#a06a35';
    ctx.fill();
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.strokeStyle = hovered ? '#ffd94a' : '#5e3a17';
    ctx.stroke();
    // Bowl.
    ctx.fillStyle = '#5e3a17';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 62, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, ing.id, r.x + r.w / 2, r.y + 52, 30);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 104, 14, '#fff8e7');
    // Key hint.
    circle(ctx, r.x + 18, r.y + 18, 11);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    text(ctx, ing.key, r.x + 18, r.y + 19, 13, '#fff8e7');
    if (ing.cooks) text(ctx, 'masak 3 dtk', r.x + r.w / 2, r.y + 122, 11, '#ffd94a');
  }
}

function drawParticles(k, ctx) {
  for (const p of k.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'steam') {
      circle(ctx, p.x, p.y, p.size);
      ctx.fillStyle = `rgba(${p.color},${(alpha * 0.5).toFixed(2)})`;
      ctx.fill();
    } else {
      circle(ctx, p.x, p.y, p.size);
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(2)})`;
      ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#c08a1e'; ctx.stroke();
    }
  }
  for (const f of k.floaters) {
    const alpha = Math.min(1, f.life / 0.7);
    ctx.globalAlpha = alpha;
    textOutline(ctx, f.text, f.x, f.y, 26, f.color);
    ctx.globalAlpha = 1;
  }
  for (const t of k.toasts) {
    const alpha = Math.min(1, t.life / 0.5);
    ctx.globalAlpha = alpha;
    const w = ctx.measureText(t.text).width + 36;
    rr(ctx, 640 - w / 2, 200, w, 40, 10);
    ctx.fillStyle = 'rgba(60,30,5,0.85)'; ctx.fill();
    text(ctx, t.text, 640, 221, 16, '#fff8e7');
    ctx.globalAlpha = 1;
  }
}

function drawTitle(k, ctx) {
  ctx.fillStyle = 'rgba(60,30,5,0.55)';
  ctx.fillRect(0, 64, 1280, 656);
  rr(ctx, 290, 110, 700, 480, 20);
  ctx.fillStyle = '#fff8e7'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#d9483b'; ctx.stroke();
  drawDish(ctx, 'soto', 640, 190, 56);
  text(ctx, 'SOTO RUSH', 640, 270, 56, '#d9483b');
  text(ctx, 'Warung Soto Express — masak cepat, antar tepat waktu!', 640, 312, 18, '#6b4423', 'normal');
  const steps = [
    '1. Klik pesanan di papan atas',
    '2. Klik bahan di bawah — Mie & Nasi dimasak di kompor',
    '3. Klik ANTAR sebelum pelanggan kehabisan sabar',
  ];
  steps.forEach((s, i) => text(ctx, s, 640, 352 + i * 30, 17, '#3a2410', 'normal'));
  text(ctx, 'Tips: sajikan cepat untuk tip besar. Kombo menaikkan bayaran!', 640, 452, 15, '#8a6a2e', 'normal');
  text(ctx, 'Shift 2,5 menit — 3 nyawa. Selamat memasak!', 640, 478, 15, '#8a6a2e', 'normal');
  rr(ctx, 490, 520, 300, 60, 14);
  ctx.fillStyle = '#d9483b'; ctx.fill();
  text(ctx, 'MULAI MASAK', 640, 551, 24, '#fff8e7');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(60,30,5,0.55)';
  ctx.fillRect(0, 64, 1280, 656);
  textOutline(ctx, 'JEDA — tekan P atau tombol ❚❚ untuk lanjut', 640, 360, 30, '#fff8e7');
}

function drawGameOver(k, ctx) {
  ctx.fillStyle = 'rgba(60,30,5,0.6)';
  ctx.fillRect(0, 64, 1280, 656);
  rr(ctx, 340, 130, 600, 440, 20);
  ctx.fillStyle = '#fff8e7'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#d9483b'; ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 190, 40, '#d9483b');
  const rows = [
    ['Koin didapat', `${k.coins}`],
    ['Hidangan disajikan', `${k.served}`],
    ['Pelanggan pergi', `${k.lost}`],
    ['Kombo terbaik', `x${k.bestCombo}`],
    ['Level tercapai', `${k.level} — ${k.levelName}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 420, 250 + i * 42, 19, '#6b4423', 'normal', 'left');
    text(ctx, value, 860, 250 + i * 42, 19, '#3a2410', 'bold', 'right');
  });
  rr(ctx, 490, 520, 300, 60, 14);
  ctx.fillStyle = '#4a8f3f'; ctx.fill();
  text(ctx, 'MAIN LAGI', 640, 551, 24, '#fff8e7');
}

// --- main entry ---------------------------------------------------------------

export function render(k, ctx) {
  ctx.save();
  if (k.shake > 0) {
    ctx.translate((Math.random() - 0.5) * k.shake, (Math.random() - 0.5) * k.shake);
  }
  drawBackground(ctx);
  drawTopBar(k, ctx);
  if (k.state === 'title') {
    // A lively backdrop behind the title card.
    drawBoard(k, ctx);
    drawPotArea(k, ctx);
    drawPlateArea(k, ctx);
    drawServeArea(k, ctx);
    drawBins(k, ctx);
    drawTitle(k, ctx);
  } else {
    drawBoard(k, ctx);
    drawPotArea(k, ctx);
    drawPlateArea(k, ctx);
    drawServeArea(k, ctx);
    drawBins(k, ctx);
    drawParticles(k, ctx);
    if (k.state === 'paused') drawPaused(ctx);
    if (k.state === 'over') drawGameOver(k, ctx);
  }
  ctx.restore();
}
