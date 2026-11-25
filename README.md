# Soto Rush — Warung Soto Express

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rapppae/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rapppae/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast cooking game set in an Indonesian street-food stall. Customers order
soto ayam, mie goreng, nasi goreng and es teh manis; you pick the ticket,
grab ingredients from the counter, cook noodles and rice on the stove, build
the plate, and serve before patience runs out. Fast serves earn tips,
streaks build a combo multiplier, and the rush gets faster every level.

Entry for the [make.fun bounty "Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137).

## How to play

- **Click a ticket** on the order board to work on that order.
- **Click an ingredient bin** to add it to the plate — Mie and Nasi go to the
  stove first (3 seconds), then click the finished pot to add them.
- **Click ANTAR** (or press Space) when the plate is complete.
- Click a filled plate slot to take that ingredient off again.
- Serve fast for a tip (up to +50%) and a PERFECT bonus; keep the combo
  alive for up to x2 pay. Three lost customers end the shift early.
- Keys: `1`–`8` pick ingredients, `Space` serves, `P` pauses, `M` mutes.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Screenshot scenes (deterministic, for the entry's screenshots):

```sh
http://localhost:8080/?shot=cover   # the cover: mid-assembly, pot cooking
http://localhost:8080/?shot=rush    # rush hour, a customer about to leave
http://localhost:8080/?shot=serve   # a perfect serve, coins flying
http://localhost:8080/?shot=combo   # combo x6, plate complete
```

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` into `out/` and writes
`out/dossier.json` with the vendored make.fun library.

## Tech

- Plain HTML + canvas 2D, ES modules, no libraries, no network requests.
- All art is drawn in code (no image files); sound is synthesized with the
  Web Audio API (no audio files).
- Node 22+, standard library only for the entrypoint.

## License

MIT — see [LICENSE](LICENSE).
