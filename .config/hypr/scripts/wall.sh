#!/usr/bin/env bash

set -euxo pipefail

# Add logging for debugging startup issues
exec 1> >(logger -t wall.sh 2>/dev/null) 2>&1 || true

# Exit immediately if another instance is already running.
# Prefer flock (atomic, race-free). Fall back to a pidfile if flock isn't available.
if command -v flock >/dev/null 2>&1; then
  LOCK_FILE="${XDG_RUNTIME_DIR:-/tmp}/wall.sh.lock"
  exec 200>"$LOCK_FILE"
  flock -n 200 || { notify-send "wall.sh" "Script already running" 2>/dev/null; exit 0; }
else
  PIDFILE="${XDG_RUNTIME_DIR:-/tmp}/wall.sh.pid"
  if [[ -f "$PIDFILE" ]]; then
    oldpid=$(cat "$PIDFILE" 2>/dev/null || true)
    if [[ -n "${oldpid:-}" ]] && kill -0 "$oldpid" 2>/dev/null; then
      notify-send "wall.sh" "Script already running" 2>/dev/null || true
      exit 0
    fi
  fi
  echo "$$" >"$PIDFILE"
  trap 'rm -f "$PIDFILE"' EXIT
fi

WALLPAPER_DIR="$HOME/.local/share/wallpapers"
MAX_SIZE=$((1000 * 1024 * 1024)) # 1 GiB
TEMP_WALL_DIR="/tmp/wallpapers"
PAGES_TO_EXPLORE=2

API_BASE_URL="https://wallhaven.cc/api/v1/search"
API_QUERY_TOPLIST="sorting=toplist&topRange=1d"
API_QUERY_RANDOM="sorting=random"
API_QUERY_BASE="purity=100&categories=110&atleast=2560x1440"
TODAY=$(date +%Y-%m-%d)
WALLPAPERS_DOWNLOADED_TODAY_FILE="$TEMP_WALL_DIR/wallpapers_downloaded_$TODAY.txt"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1" >&2
    notify-send "wall.sh" "Missing dependency: $1" 2>/dev/null || true
    exit 1
  }
}

fetching_wallpapers() {
  local url="$1"
  local page_to_explore="$2"
  local notify_message="${3:-Fetching new wallpapers...}"
  
  notify-send "wall.sh" "${notify_message}" 2>/dev/null || true

  for ((i = 1; i <= page_to_explore; i++)); do
    echo "Fetching page $i of wallpapers..."
    curl -fsS --max-time 15 "${url}&page=${i}" \
      | jq -r '.data[].path' \
      | while read -r url; do
          [[ -n "$url" ]] || continue
          filename=$(basename "$url")
          target="$WALLPAPER_DIR/$filename"
          if [[ -f "$target" ]]; then
            echo "$filename already exists. Skipping download."
            continue
          fi

          echo "Downloading $filename..."
          # Download to a temp file first to avoid leaving partial files behind.
          tmpfile="${target}.part"
          if curl -fL --max-time 60 -o "$tmpfile" "$url"; then
            mv -f "$tmpfile" "$target"
          else
            rm -f "$tmpfile"
          fi
        done
  done
}


require_cmd curl
require_cmd jq
require_cmd hyprctl
require_cmd find
require_cmd shuf
require_cmd du
require_cmd awk
require_cmd sort
require_cmd head

mkdir -p "$WALLPAPER_DIR" "$TEMP_WALL_DIR"

# Cleanup markers from previous days


# Wait for API connectivity (avoids hanging on ICMP-blocked networks).


ALL_FILES_SIZE=$(du -sb "$WALLPAPER_DIR" 2>/dev/null | awk '{print $1}' || echo 0)
if ((ALL_FILES_SIZE > MAX_SIZE)); then
  echo "Total wallpaper size exceeds 1GiB. Removing oldest files..."
  # Remove a small batch of oldest files; repeat next run if still oversized.
  find "$WALLPAPER_DIR" -type f -printf '%T@\t%p\n' | sort -n | head -n 50 | cut -f2- | xargs -r rm -f
fi

if [[ ! -f "$WALLPAPERS_DOWNLOADED_TODAY_FILE" ]]; then
  fetching_wallpapers "${API_BASE_URL}?${API_QUERY_TOPLIST}&${API_QUERY_BASE}" "$PAGES_TO_EXPLORE" "Fetching today's top wallpapers..."
  find "$TEMP_WALL_DIR" -maxdepth 1 -type f -delete
  touch "$WALLPAPERS_DOWNLOADED_TODAY_FILE"
fi

# fetching_wallpapers "${API_BASE_URL}?${API_QUERY_BASE}" "$PAGES_TO_EXPLORE"
if ((ALL_FILES_SIZE == 0)); then
  for _ in {1..30}; do
    if curl -fsS --max-time 3 "${API_BASE_URL}?${API_QUERY_BASE}&page=1" >/dev/null; then
      break
    fi
    sleep 2
  done

  fetching_wallpapers "${API_BASE_URL}?${API_QUERY_RANDOM}&${API_QUERY_BASE}" "$PAGES_TO_EXPLORE" "Fetching random wallpapers..."
else
  notify-send "wall.sh" "Using existing wallpapers" 2>/dev/null || true
fi

# Collect currently loaded wallpapers (may be multiple monitors).
declare -A CURRENT_BASENAMES=()
while read -r line; do
  [[ -n "$line" ]] || continue
  CURRENT_BASENAMES["$(basename "$line")"]=1
done < <(hyprctl hyprpaper listloaded 2>/dev/null || true)

# Pick a random wallpaper that isn't currently loaded.
WALLPAPER=""
for _ in {1..20}; do
  candidate=$(find "$WALLPAPER_DIR" -type f | shuf -n 1 || true)
  [[ -n "$candidate" ]] || break
  base=$(basename "$candidate")
  if [[ -z "${CURRENT_BASENAMES[$base]+x}" ]]; then
    WALLPAPER="$candidate"
    break
  fi
done

if [[ -z "$WALLPAPER" ]]; then
  echo "No suitable wallpaper found in $WALLPAPER_DIR" >&2
  notify-send "wall.sh" "No suitable wallpaper found" 2>/dev/null || true
  exit 1
fi

MONITOR_NAME=$(hyprctl monitors | awk '/^Monitor/{print $2; exit}')
if [[ -z "${MONITOR_NAME:-}" ]]; then
  echo "Could not detect monitor name from hyprctl monitors" >&2
  notify-send "wall.sh" "Could not detect monitor" 2>/dev/null || true
  exit 1
fi

WALLPAPER_BASENAME=$(basename "$WALLPAPER")
TEMP_WALL_PATH="$TEMP_WALL_DIR/$WALLPAPER_BASENAME"

echo "Using monitor: $MONITOR_NAME"
mv -f "$WALLPAPER" "$TEMP_WALL_PATH"

echo "Selected wallpaper: $TEMP_WALL_PATH"
hyprctl hyprpaper wallpaper "$MONITOR_NAME","$TEMP_WALL_PATH"