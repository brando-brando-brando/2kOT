# 2KOT — NBA 2K26 Opponent Tracker

Tracks who you play, your record against them, and (once screen reading is
calibrated) fills that in automatically from captured gameplay.

| Folder | What it is | Stack |
| --- | --- | --- |
| `2kot-app` | Dashboard UI | React, TypeScript, Vite, Tailwind |
| `2kot-server` | Local API, SQLite storage, screen-reading pipeline | Python, FastAPI, OpenCV |
| `2kot-frame-capture` | Tool for capturing and labelling sample frames | React, TypeScript, Vite |

## Running it

Start the server, then the dashboard, in two terminals:

```bash
cd 2kot-server && uv run python -m twokot
```

```bash
cd 2kot-app && npm run dev
```

The dashboard proxies `/api` to the server on port 8787. Data is stored in
`~/.2kot` (`2kot.db` plus a `frames` folder); set `TWOKOT_DATA_DIR` to use a
different location.

## Checks

```bash
cd 2kot-server && uv run pytest && uv run ruff check .
```

```bash
cd 2kot-app && npm run build && npm run lint
```

## API

All under `/api`: `GET/POST /opponents`, `GET/PATCH/DELETE /opponents/{id}`,
`GET /games`, `POST /game_result`, `DELETE /games/{id}`, `GET /stats`,
`GET /stats/{opponent_id}`, `POST /frames`, `GET /frames/{id}/image`,
`GET /live`. Interactive docs are at http://127.0.0.1:8787/docs while the
server runs.

## Where screen reading stands

Everything around screen reading is built and tested: storage, opponent name
matching that tolerates OCR look-alike errors, the game session tracker, OCR
text parsing and image preparation. Two pieces wait on real captured frames,
in `2kot-server/src/twokot/vision/pipeline.py`:

1. `classify_screen`: recognising matchup, in-game and end-game screens.
2. `REGIONS`: where the name, rating and score sit on each screen.

An OCR engine also still has to be chosen and tested against those frames.
To load labelled samples exported from the capture tool:

```bash
cd 2kot-server && uv run python -m twokot.dataset import ~/Downloads/2kot-frames-*.json
```
