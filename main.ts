// Soto Rush — entrypoint for the make.fun cooking-game bounty.
// The game itself is plain static files under game/ (index.html plus ES
// modules, no network requests). This program hands it in: it copies game/
// and screenshots/ from beside this file into the output directory and
// writes dossier.json, the summary the judge reads, using the vendored
// make.fun library. Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader sets MAKEFUN_OUTPUT_DIR to /output itself.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps for this bounty: the text budget shapes the dossier
// bytes; the other caps refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB, more than 993 files or 48 MiB under
// game/, or a game/ path longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Soto Rush: wrote ${out}/dossier.json`);
