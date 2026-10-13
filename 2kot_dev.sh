#!/usr/bin/env bash
# Start 2KOT for development: three Terminal windows, one each for the server,
# the dashboard and the capture tool. Press Ctrl-C in a window to stop that part.
#
#   ./2kot_dev.sh            open all three and the dashboard in the browser
#   ./2kot_dev.sh --no-open  do not open the browser
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PORT=8787
# The dashboard and capture tool ports can be moved if something else has them.
APP_PORT="${TWOKOT_APP_PORT:-5183}"
CAPTURE_PORT="${TWOKOT_CAPTURE_PORT:-5184}"
OPEN_FLAG=" --open"

for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_FLAG="" ;;
    -h|--help) sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -d "$ROOT/2kot-server/.venv" && -d "$ROOT/2kot-app/node_modules" \
  && -d "$ROOT/2kot-frame-capture/node_modules" ]] \
  || die "Dependencies are missing. Run ./install.sh first."

for port in "$SERVER_PORT" "$APP_PORT" "$CAPTURE_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    die "Port $port is already in use. Is 2KOT already running? (lsof -nP -iTCP:$port -sTCP:LISTEN shows what has it.)"
  fi
done

# open_window <title> <dir> <command>: run the command in a new Terminal window.
open_window() {
  osascript - "$1" "$2" "$3" >/dev/null <<'APPLESCRIPT'
on run {theTitle, theDir, theCommand}
  tell application "Terminal"
    activate
    set theTab to do script "cd " & quoted form of theDir & " && clear && " & theCommand
    set custom title of theTab to theTitle
  end tell
end run
APPLESCRIPT
}

open_window "2KOT server"       "$ROOT/2kot-server"        "uv run python -m twokot --port $SERVER_PORT"
open_window "2KOT dashboard"    "$ROOT/2kot-app"           "npm run dev -- --port $APP_PORT$OPEN_FLAG"
open_window "2KOT capture tool" "$ROOT/2kot-frame-capture" "npm run dev -- --port $CAPTURE_PORT"

cat <<INFO
Opened three Terminal windows:
  Server        http://127.0.0.1:$SERVER_PORT/docs
  Dashboard     http://localhost:$APP_PORT
  Capture tool  http://localhost:$CAPTURE_PORT
Press Ctrl-C in a window to stop that part.
INFO
