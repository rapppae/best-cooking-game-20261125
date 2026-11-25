// Soto Rush — entry point: the animation loop, mouse + keyboard input,
// and the deterministic screenshot mode (?shot=cover|rush|serve|combo).

import { INGREDIENTS, VIEW } from './config.js';
import { Kitchen } from './kitchen.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7');

const kitchen = new Kitchen(seed);
let lastTime = performance.now();

// Scale a pointer position from the displayed canvas back to 1280x720.
function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  kitchen.update(dt);
  render(kitchen, ctx);
  if (!shotName) requestAnimationFrame(frame);
}

function pointerDown(event) {
  kitchen.sfx.ensure();
  const pos = toLogical(event);
  kitchen.act(kitchen.hitTest(pos.x, pos.y));
}

function pointerMove(event) {
  const pos = toLogical(event);
  kitchen.hover = kitchen.hitTest(pos.x, pos.y);
}

function keyDown(event) {
  if (event.repeat) return;
  kitchen.sfx.ensure();
  const key = event.key.toLowerCase();
  if (key === 'p' || key === 'escape') {
    kitchen.togglePause();
    return;
  }
  if (key === 'm') {
    kitchen.sfx.toggleMute();
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    if (kitchen.state === 'title') kitchen.start();
    else if (kitchen.state === 'over') kitchen.restart();
    else kitchen.serve();
    return;
  }
  if (key === 'enter') {
    if (kitchen.state === 'title') kitchen.start();
    else if (kitchen.state === 'over') kitchen.restart();
    return;
  }
  const binIndex = INGREDIENTS.findIndex((ing) => ing.key === key);
  if (binIndex >= 0) kitchen.addIngredient(INGREDIENTS[binIndex].id);
}

if (shotName) {
  // Screenshot mode: a frozen, deterministic scene. Run the update loop a
  // few dozen fixed steps so steam and particles settle, then paint once.
  // No animation loop, no audio, no timers — the frame is identical every run.
  kitchen.setupShot(shotName, seed);
  for (let i = 0; i < 24; i++) kitchen.update(1 / 60);
  render(kitchen, ctx);
  document.title = `Soto Rush — ${shotName}`;
} else {
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('keydown', keyDown);
  requestAnimationFrame(frame);
}
