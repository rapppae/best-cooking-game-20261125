# SUBMIT HANDOFF — Soto Rush (best-cooking-game-20261125-0137)

## Status: SIAP SUBMIT — menunggu repo dibuat + push

Langkah `gh repo create` / push / set About repo **belum dijalankan** — terblokir
menunggu OK eksplisit user (flag keamanan sistem soal push repo). Semua yang
bisa dikerjakan lokal SUDAH selesai dan ter-commit.

## Repo

- Nama repo target: `rapppae/best-cooking-game-20261125`
- Commit lokal: `772c20e` — "Soto Rush — warung soto cooking game for make.fun best-cooking-game-20261125-0137" (commit game; handoff ini commit kedua — **submit pakai SHA HEAD saat push, lihat `git log -1`**)
- Direktori lokal: `~/workspace/makefun/best-cooking-game-20261125/`
- Bounty: https://make.fun/bounty/best-cooking-game-20261125-0137
- Deadline: **25 Nov 2026 20:37 WIB**. Blind round berikutnya **11:37 WIB** —
  submit sebelum itu supaya ikut round itu.

## File (19 file, ter-commit semua)

- `main.ts` — entrypoint: salin game/ + screenshots/ ke /output, tulis dossier.json
- `serve.ts` — dev server lokal (port 8080)
- `package.json` — {"type":"module"}
- `LICENSE` — MIT (baris pertama SPDX-License-Identifier: MIT)
- `README.md` — 3 badge live + link bounty + cara main
- `SUBMIT-HANDOFF.md` — file ini
- `vendor/makefun-game.ts` — disalin dari kit TANPA diubah (diff terverifikasi identik)
- `game/index.html`, `game/package.json`
- `game/src/config.js` — hidangan, bahan, timing, layout
- `game/src/random.js` — RNG deterministik (mulberry32)
- `game/src/audio.js` — SFX sintesis WebAudio, tanpa file audio
- `game/src/orders.js` — tiket pesanan + patience
- `game/src/kitchen.js` — state + aturan main + scene screenshot
- `game/src/render.js` — semua gambar canvas 2D
- `game/src/main.js` — loop, input, mode screenshot (?shot=)
- `screenshots/1-cover.png` (155.114 byte), `2-rush.png` (150.071),
  `3-serve.png` (178.397), `4-combo.png` (164.292) — semua 1280x720,
  render asli dari kode game, di bawah 256 KiB. `1-cover.png` = cover.

## Game: Soto Rush — Warung Soto Express

Game masak 2D canvas, ide sendiri (bukan starter kit). Pemain menjalankan
warung soto: klik tiket pesanan di papan atas, klik bahan di counter
(8 bahan: Kuah Soto, Ayam Suwir, Nasi, Mie, Telur, Sayur, Teh, Es Batu),
Mie & Nasi dimasak 3 detik di kompor, rakit piring, klik ANTAR sebelum
patience pelanggan habis. Sajian cepat = tip s.d. +50% + bonus PERFECT,
kombo beruntun s.d. x2. 4 hidangan (Soto Ayam, Mie Goreng, Nasi Goreng,
Es Teh Manis), level naik tiap 45 detik, shift 2,5 menit, 3 nyawa.
Suara disintesis WebAudio; semua art digambar di kode (tanpa file gambar);
tanpa network request; keyboard 1-8 / Space / P / M.

## Tes lokal (semua lolos)

- `node --check` semua file JS/TS lolos.
- Tes logika headless (`/tmp/soto-test.mjs`): serve Soto Ayam = 103 koin
  (60 base + tip + PERFECT), deny bahan salah, pelanggan pergi kurangi
  nyawa, game over saat nyawa habis / waktu habis, 4 scene screenshot OK.
- Screenshot diambil dengan Playwright Chromium (headless shell, cache lokal)
  dari `node serve.ts` — Meta Chromium di VM tidak bisa jalan headless
  (segfault / butuh policy domain); Playwright cache sudah ada di VM.
- `main.ts` dijalankan 2x ke direktori berbeda: output byte-identik
  (deterministik). Dossier: schema makefun/dossier/v1, teks 57.959 byte
  (< 163.840), 4 gambar, cover index 0, total dossier 924.097 byte
  (< 1,5 MiB). Game: 9 file source, 57.301 byte.

## Langkah submit (setelah OK user)

1. `gh repo create rapppae/best-cooking-game-20261125 --public --source=. --push`
   (dari direktori repo; commit `772c20e`)
2. Set About repo: deskripsi menyebut make.fun, homepage
   https://make.fun/bounty/best-cooking-game-20261125-0137, topics
   `makefun, ai-agents, bounties, growth`.
3. Bundle transkrip sesi builder ini (sesi subagent ini) + parent-trimmed,
   lalu `node cli/makefun.mjs submit --competition best-cooking-game-20261125-0137 --repo-url https://github.com/rapppae/best-cooking-game-20261125 --commit 772c20e --title "best-cooking-game-20261125" --bundle <transcripts.tar.gz> --keypair ~/workspace/makefun/makefun-keypair.json`
4. Verifikasi: `check --kit` lolos, entry muncul di halaman bounty.

## Catatan

- 764 submission saat dicek pagi — tidak ada janji menang/top-10.
- Sesi build ini dimulai 25 Nov ~09:41 WIB (setelah pembukaan 08:37 WIB),
  thinking_in_window terpenuhi. Kode ditulis dari nol di sesi ini + revisi
  1x di pesan terpisah (perbaikan render kompor/meja saji).
