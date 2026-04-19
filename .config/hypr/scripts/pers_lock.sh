#!/bin/bash
# Path to wallpapers
WALLPAPER_DIR="$HOME/.local/share/wallpapers"

# Pick a random file (supports jpg/png)
RANDOM_WALLPAPERS=$(find "$WALLPAPER_DIR" -type f \( -iname '*.jpg' -o -iname '*.png' \) | shuf -n 2)
RANDOM_WALLPAPER=$(echo "$RANDOM_WALLPAPERS" | head -n 1)
NEXT_WALLPAPER=$(echo "$RANDOM_WALLPAPERS" | tail -n 1)

HYPRLOCK_FILE="$HOME/.config/hypr/hyprlock.conf"

sed -i "s|^\$wallpaper = .*|\$wallpaper = $RANDOM_WALLPAPER|" "$HYPRLOCK_FILE"
sed -i "s|^\$profile = .*|\$profile = $NEXT_WALLPAPER|" "$HYPRLOCK_FILE"
