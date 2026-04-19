
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREV_IMAGE=$(hyprctl hyprpaper listloaded)
source "$SCRIPT_DIR/common_wall.sh"
IS_RUNNING=$(pgrep -f "$(basename "${BASH_SOURCE[0]}")" | wc -l)
IS_WALL_RUNNING=$(pgrep -f "wall.sh" | wc -l)
POSSIBLE_DIRECTIONS=("next" "prev")
DIRECTION="$1"

ORDER_BY_DATE_FILES=()
WALLPAPER_TO_SET=""
POSITION_PREV_IMAGE=-1

RANDOM_SLEEP=$(awk -v min=0.2 -v max=0.8 'BEGIN{srand(); print min+rand()*(max-min)}')

echo "Is running instances of from_temp_wall.sh: $IS_RUNNING"
if [[ -z "$DIRECTION" ]]; then
    DIRECTION="next"
fi

if [[ ! " ${POSSIBLE_DIRECTIONS[@]} " == *" $DIRECTION "* ]]; then
    echo "Invalid direction. Use 'next' or 'prev'."
    exit 1
fi


if (( IS_RUNNING > 2 || IS_WALL_RUNNING > 2 )); then
  notify-send "Wallpaper changer is already running."
  exit 1
fi


if [[ ! -e ${TEMP_DIR} ]]; then 
    notify-send "Temporary wallpaper directory not found!"
    exit 1
fi

while IFS= read -r -d $'\0' file; do
    ORDER_BY_DATE_FILES+=("$file")
    if [[ "$file" == "$PREV_IMAGE" ]]; then
        POSITION_PREV_IMAGE=$((${#ORDER_BY_DATE_FILES[@]}-1))
    fi
done < <(find "$TEMP_DIR" -maxdepth 1 -type f -printf '%T@ %p\0' | sort -rz | cut -z -d' ' -f2-)

if [[ ${#ORDER_BY_DATE_FILES[@]} -eq 0 ]]; then
    notify-send "No wallpapers found in temporary directory."
    exit 1
fi

if [[ -z "$PREV_IMAGE" || $POSITION_PREV_IMAGE -eq -1 ]]; then
    notify-send "No wallpaper is currently set."
    exit 1
fi

if [[ $POSITION_PREV_IMAGE -eq ${#ORDER_BY_DATE_FILES[@]}-1 && $DIRECTION == "next" ]]; then
    notify-send "Already at the latest wallpaper."
    exit 0
elif [[ $POSITION_PREV_IMAGE -eq 0 && $DIRECTION == "prev" ]]; then
    notify-send "Already at the oldest wallpaper."
    exit 0
fi


if [[ $DIRECTION == "next" ]]; then
    WALLPAPER_TO_SET="${ORDER_BY_DATE_FILES[$((POSITION_PREV_IMAGE + 1))]}"
else
    WALLPAPER_TO_SET="${ORDER_BY_DATE_FILES[$((POSITION_PREV_IMAGE - 1))]}"
fi

if [[ -z "$WALLPAPER_TO_SET" ]]; then
    notify-send "ERROR: No wallpaper found to set."
    exit 1
fi

if [[ -z "$WALLPAPER_TO_SET" || ! -f "$WALLPAPER_TO_SET" ]]; then
    notify-send "No valid wallpaper found to set."
    exit 1
fi

MONITOR_NAME=$(hyprctl monitors | grep -oP '(?<=Monitor)\s+[a-zA-z0-9-]+' | head -n 1 | xargs)
echo "Using monitor: $MONITOR_NAME"

hyprctl hyprpaper wallpaper "$MONITOR_NAME","$WALLPAPER_TO_SET"
notify-send "Wallpaper changed to $(basename "$WALLPAPER_TO_SET")"
sleep "$RANDOM_SLEEP"

