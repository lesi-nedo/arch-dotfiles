#!/usr/bin/env bash
if [ -z "$HOME" ]; then
  HOME=$(/usr/bin/env bash -c 'echo $HOME')
fi

FILE_WITH_10_LAST_INSTALLED_PKG="$HOME/.config/last_installed_pkgs.txt"
LAST_10_LINES=$(grep "\[ALPM\] installed" /var/log/pacman.log | tail -n 10)
PUSH_WITH_NEW_PACKAGES=0
FILE_WITH_ALL_PACMAN_PKGS="$HOME/.config/all_installed_pkgs.txt"
FILE_WITH_ALL_AUR_PKGS="$HOME/.config/all_installed_aur_pkgs.txt"
dotfiles="git --git-dir=$HOME/.dotfiles --work-tree=$HOME"

if [ ! -f "$FILE_WITH_10_LAST_INSTALLED_PKG" ]; then
    touch "$FILE_WITH_10_LAST_INSTALLED_PKG"
    echo "$LAST_10_LINES" > "$FILE_WITH_10_LAST_INSTALLED_PKG"
    PUSH_WITH_NEW_PACKAGES=1
else
    if ! diff <(echo "$LAST_10_LINES") "$FILE_WITH_10_LAST_INSTALLED_PKG" &> /dev/null; then
        echo "$LAST_10_LINES" > "$FILE_WITH_10_LAST_INSTALLED_PKG"
        PUSH_WITH_NEW_PACKAGES=1
    fi
fi

if [ $PUSH_WITH_NEW_PACKAGES -eq 1 ]; then
    echo "New packages installed:"
    echo "Saving to $FILE_WITH_ALL_PACMAN_PKGS and $FILE_WITH_ALL_AUR_PKGS, then pushing to remote."
    ALL_PKGS=$(pacman -Qe)
    ALL_AUR_PKGS=$(pacman -Qqm)
    echo "$ALL_PKGS" > "$FILE_WITH_ALL_PACMAN_PKGS"
    echo "$ALL_AUR_PKGS" > "$FILE_WITH_ALL_AUR_PKGS"
    $dotfiles add "$FILE_WITH_ALL_PACMAN_PKGS" "$FILE_WITH_ALL_AUR_PKGS"
    $dotfiles commit -m "Update installed packages"
    $dotfiles push origin main
fi
