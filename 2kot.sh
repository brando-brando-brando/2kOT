#!/usr/bin/env bash
# Run 2KOT in this terminal: the server, the dashboard and the capture tool.
# Keep the terminal open; press Ctrl-C to stop everything.
#
#   ./2kot.sh               start everything and open the dashboard
#   ./2kot.sh --no-capture  skip the capture tool (no live tracking)
#   ./2kot.sh --no-open     do not open the browser
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PORT=8787
# The dashboard and capture tool ports can be moved if something else has them.
APP_PORT="${TWOKOT_APP_PORT:-5183}"
CAPTURE_PORT="${TWOKOT_CAPTURE_PORT:-5184}"
WITH_CAPTURE=1
OPEN_BROWSER=1

for arg in "$@"; do
  case "$arg" in
    --no-capture) WITH_CAPTURE=0 ;;
    --no-open) OPEN_BROWSER=0 ;;
    -h|--help) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }
listening() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

PYTHON="$ROOT/2kot-server/.venv/bin/python"
[[ -x "$PYTHON" && -x "$ROOT/2kot-app/node_modules/.bin/vite" \
  && -x "$ROOT/2kot-frame-capture/node_modules/.bin/vite" ]] \
  || die "Dependencies are missing. Run ./install.sh first."

PORTS=("$SERVER_PORT" "$APP_PORT")
[[ "$WITH_CAPTURE" == 1 ]] && PORTS+=("$CAPTURE_PORT")
for port in "${PORTS[@]}"; do
  listening "$port" && die "Port $port is already in use. Is 2KOT already running? (lsof -nP -iTCP:$port -sTCP:LISTEN shows what has it.)"
done

PIDS=()
NAMES=()

# start <name> <dir> <command...>: run in the background, prefixing each output line.
start() {
  local name="$1" dir="$2"
  shift 2
  (cd "$dir" && exec "$@") > >(sed -l "s/^/[$name] /") 2>&1 &
  PIDS+=($!)
  NAMES+=("$name")
}

stop_all() {
  trap - INT TERM EXIT
  printf '\nStopping 2KOT...\n'
  kill "${PIDS[@]}" 2>/dev/null
  wait 2>/dev/null
  echo "Stopped."
  exit "${1:-0}"
}
trap 'stop_all 0' INT TERM
trap 'stop_all $?' EXIT

# wait_for <name> <port>: block until the port answers, or stop if the process died.
wait_for() {
  local name="$1" port="$2" i
  for ((i = 0; i < 120; i++)); do
    listening "$port" && return 0
    kill -0 "${PIDS[${#PIDS[@]}-1]}" 2>/dev/null || { echo "$name failed to start."; stop_all 1; }
    sleep 0.5
  done
  echo "$name did not come up on port $port."
  stop_all 1
}

PYTHONUNBUFFERED=1 start server "$ROOT/2kot-server" "$PYTHON" -m twokot --port "$SERVER_PORT"
wait_for "The server" "$SERVER_PORT"

start dashboard "$ROOT/2kot-app" node_modules/.bin/vite --port "$APP_PORT" --strictPort
wait_for "The dashboard" "$APP_PORT"

if [[ "$WITH_CAPTURE" == 1 ]]; then
  start capture "$ROOT/2kot-frame-capture" node_modules/.bin/vite --port "$CAPTURE_PORT" --strictPort
  wait_for "The capture tool" "$CAPTURE_PORT"
fi

printf '\n\033[1;32m2KOT is running.\033[0m\n'
echo "  Dashboard     http://localhost:$APP_PORT"
[[ "$WITH_CAPTURE" == 1 ]] && echo "  Capture tool  http://localhost:$CAPTURE_PORT"
echo "  Server API    http://127.0.0.1:$SERVER_PORT/docs"
printf '\nPress Ctrl-C to stop everything.\n\n'

[[ "$OPEN_BROWSER" == 1 ]] && open "http://localhost:$APP_PORT"

# Stay in the foreground; if any part exits by itself, take the rest down too.
while true; do
  for i in "${!PIDS[@]}"; do
    if ! kill -0 "${PIDS[$i]}" 2>/dev/null; then
      echo "${NAMES[$i]} exited unexpectedly."
      stop_all 1
    fi
  done
  sleep 1
done
