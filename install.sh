#!/usr/bin/env bash
# Set up 2KOT on a Mac, for running it and for developing on it.
# Safe to re-run: anything already in place is left alone.
#
#   ./install.sh           install tools and dependencies
#   ./install.sh --check   also run the tests, lint and builds afterwards
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${TWOKOT_DATA_DIR:-$HOME/.2kot}"
RUN_CHECKS=0

for arg in "$@"; do
  case "$arg" in
    --check) RUN_CHECKS=1 ;;
    -h|--help) sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
die()  { printf '\n\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[[ "$(uname -s)" == "Darwin" ]] || die "This script is for macOS."

step "Xcode Command Line Tools (git, compilers)"
if xcode-select -p >/dev/null 2>&1; then
  ok "installed"
else
  xcode-select --install || true
  die "Finish the Command Line Tools install in the dialog that just opened, then run ./install.sh again."
fi

# Homebrew lives in /opt/homebrew on Apple silicon and /usr/local on Intel,
# and a fresh install is not on PATH until the shell profile is reloaded.
load_brew() {
  local candidate
  for candidate in "$(command -v brew || true)" /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      eval "$("$candidate" shellenv)"
      return 0
    fi
  done
  return 1
}

# Only called when something actually has to be installed.
ensure_brew() {
  load_brew && return 0
  step "Homebrew"
  echo "    Homebrew is needed to install missing tools. Its installer will ask for your password."
  read -r -p "    Install Homebrew now? [y/N] " answer
  [[ "$answer" =~ ^[Yy] ]] || die "Homebrew is required. Install it from https://brew.sh and run ./install.sh again."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  load_brew || die "Homebrew was installed but could not be found. Open a new terminal and run ./install.sh again."
}

load_brew || true

# Vite 8 needs Node 20.19+ or 22.12+.
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  node -e 'const [a, b] = process.versions.node.split(".").map(Number);
           process.exit(a > 22 || (a === 22 && b >= 12) || (a === 20 && b >= 19) ? 0 : 1)'
}

step "Node.js"
if node_ok; then
  ok "node $(node -v)"
else
  command -v node >/dev/null 2>&1 && echo "    node $(node -v) is too old (need 20.19+ or 22.12+)"
  ensure_brew
  brew install node
  hash -r
  node_ok || die "Homebrew installed Node, but an older node is first on PATH: $(command -v node)"
  ok "node $(node -v)"
fi

step "uv (Python package manager; it also fetches Python 3.11+ if needed)"
if command -v uv >/dev/null 2>&1; then
  ok "$(uv --version)"
else
  ensure_brew
  brew install uv
  ok "$(uv --version)"
fi

step "Server dependencies (2kot-server)"
(cd "$ROOT/2kot-server" && uv sync)
ok "Python environment ready in 2kot-server/.venv"

step "Dashboard dependencies (2kot-app)"
(cd "$ROOT/2kot-app" && npm ci --no-audit --no-fund)

step "Capture tool dependencies (2kot-frame-capture)"
(cd "$ROOT/2kot-frame-capture" && npm ci --no-audit --no-fund)

step "Data folder"
mkdir -p "$DATA_DIR/frames"
ok "$DATA_DIR"

if [[ "$RUN_CHECKS" == 1 ]]; then
  step "Server tests and lint"
  (cd "$ROOT/2kot-server" && uv run pytest -q && uv run ruff check .)
  step "Dashboard build and lint"
  (cd "$ROOT/2kot-app" && npm run build && npm run lint)
  step "Capture tool build and lint"
  (cd "$ROOT/2kot-frame-capture" && npm run build && npm run lint)
fi

printf '\n\033[1;32m2KOT is ready.\033[0m\n\n'
cat <<'NEXT'
  ./2kot.sh        run everything in this terminal (Ctrl-C stops it)
  ./2kot_dev.sh    open the server, dashboard and capture tool in three Terminal windows

The first time you use the capture tool, your browser will ask for camera
access so it can read the Elgato capture card.
NEXT
