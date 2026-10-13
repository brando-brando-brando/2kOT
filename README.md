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
`GET /games`, `POST /game_result`, `PATCH/DELETE /games/{id}`,
`POST /games/{id}/stats_photo`, `GET /stats`,
`GET /stats/{opponent_id}`, `POST /frames`, `POST /frames/analyze`,
`GET /frames/{id}/image`,
`GET /live`. Interactive docs are at http://127.0.0.1:8787/docs while the
server runs.

## Screen reading

The server recognises these screens and reads the values on them. It is
calibrated on one recorded 1v1 Theater game (`2kot-frame-capture/samples`).

| Screen | Label | What is read |
| --- | --- | --- |
| "YOU" player card | `my_player_load_screen` | your name, rating, level |
| "OPPONENT" player card | `opponent_player_load_screen` | opponent name, rating, level |
| Player Matchup | `player_matchup` | both names, ratings, positions, builds; one frame is kept for the dashboard |
| Gameplay (scoreboard visible) | `in_game` | live score |
| YOU WON / YOU LOST | `game_result` | outcome and final score |
| Winners Circle | `winners_circle` | nothing (marks the end sequence) |
| Game Stats table | `final_game_stats` | points per side, plus the other columns where legible |

Everything else is `other`. Each value is read on many frames and the most
common reading wins; a result is recorded once the result screen and the stats
table agree, or when the end sequence finishes.

Text positions live in `2kot-server/src/twokot/vision/screens.py`; the game
flow is in `session.py`. OCR is RapidOCR, running locally.

### Live tracking

With the server running, start the capture tool, choose **Live tracking** and
press Start Tracking. Frames go to `POST /api/frames/analyze`; the dashboard
follows along.

```bash
cd 2kot-frame-capture && npm run dev
```

### Replaying a recording

Run a capture-tool export through the same pipeline. `--dry-run` shows what
would be recorded without touching the database.

```bash
cd 2kot-server && uv run python -m twokot.replay --dry-run ../2kot-frame-capture/samples/raw/<export>.json
```

### Stats from a photo

The stats screen only appears if you bring it up, so a game can be recorded
without it. To add stats afterwards, open the game from Game History and use
**Add Stats Photo** with a photo or screenshot of any screen that shows a
box-score table. The values read are shown for review and are saved only when
you press Save Stats; every cell can also be typed or corrected by hand.

The reader finds the table by its column names (PTS, REB, AST, ...) rather
than by position, so it does not depend on the screen layout. It is tested on
the in-game stats screen only; other layouts need sample photos to confirm.

### Known limits

- Capture below 720p (the first sample was 640x480) is too small for the
  card level, and makes card ratings and the stats table unreliable. The
  capture tool asks the device for 1920x1080, where these read cleanly.
- Calibrated on two games in one mode (1v1 Theater), one loss and one win. Other modes may place things
  differently and will need their own samples.
- Game mode is taken from the matchup screen's subtitle.
