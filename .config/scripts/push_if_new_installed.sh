#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

if [ -z "${HOME:-}" ]; then
  HOME=$(/usr/bin/env bash -c 'echo $HOME')
fi

PACLOG="/var/log/pacman.log"
FILE_WITH_ALL_PACMAN_PKGS="$HOME/.config/all_installed_pkgs.txt"
FILE_WITH_ALL_AUR_PKGS="$HOME/.config/all_installed_aur_pkgs.txt"

dotfiles() {
  git --git-dir="$HOME/.dotfiles" --work-tree="$HOME" "$@"
}


if ! git --git-dir="$HOME/.dotfiles" rev-parse --is-bare-repository >/dev/null 2>&1; then
  echo "Error: $HOME/.dotfiles is not a valid bare Git repository."
  exit 1
fi

# Check if variables are defined and files exist
for file in "$FILE_WITH_ALL_PACMAN_PKGS" "$FILE_WITH_ALL_AUR_PKGS"; do
  if [ -z "$file" ]; then
    echo "Error: One or more file variables are undefined."
    exit 1
  fi
  if [ ! -f "$file" ]; then
    echo "Error: File $file does not exist."
    exit 1
  fi
done

mkdir -p "$HOME/.config"

if [[ ! -r "$PACLOG" ]]; then
  echo "Pacman log not readable: $PACLOG"
  exit 0
fi


pacman -Qe  > "$FILE_WITH_ALL_PACMAN_PKGS"
pacman -Qqm > "$FILE_WITH_ALL_AUR_PKGS" || true
# Only commit if these files actually changed in the repo
if ! dotfiles diff --quiet  -- "$FILE_WITH_ALL_PACMAN_PKGS" "$FILE_WITH_ALL_AUR_PKGS"; then
    echo "New packages installed/deleted; refreshing package lists…"
    dotfiles add "$FILE_WITH_ALL_PACMAN_PKGS" "$FILE_WITH_ALL_AUR_PKGS"
    dotfiles commit -m "Update installed packages $(date -Iseconds)" || true
    # Skip push if offline
    if ping -c1 -W3 github.com >/dev/null 2>&1 || dotfiles ls-remote -q origin >/dev/null 2>&1; then
        dotfiles push -q origin main || true
        echo "Pushed updates."
    else
        echo "Network unavailable; commit saved locally."
    fi
else
    echo "No changes to commit."
fi



