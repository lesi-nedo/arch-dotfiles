#/usr/bin/env bash


# Change the screen lock wallpaper

~/.config/hypr/scripts/pers_lock.sh
if [[ $? -ne 0 ]]; then
  notify-send "Failed to change lock screen wallpaper."
  exit 1
fi
# Lock the screen
hyprlock