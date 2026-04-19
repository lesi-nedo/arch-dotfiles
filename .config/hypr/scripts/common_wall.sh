#!/usr/bin/env bash

WALLPAPER_DIR="$HOME/.local/share/wallpapers/"
ALL_FILES_SIZE=$(du -sb "$WALLPAPER_DIR" | awk '{print $1}')
MAX_SIZE=$((1000 * 1024 * 1024)) # 1gb
TEMP_DIR="/tmp/wallpapers"
PAGES_TO_EXPLORE=2
STATIC_DIR="$PWD/static"
ALREADY_SENT_FILE_NAME="$STATIC_DIR/$(date +%Y-%m-%d).txt"
SORTING="sorting=toplist&topRange=1d"

ENV_FILE="$HOME/.env"