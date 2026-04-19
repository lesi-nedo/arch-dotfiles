# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=1000
setopt autocd extendedglob
unsetopt beep
bindkey -e
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/lesi-nedo/.zshrc'
fpath+=~/.zfunc 
autoload -Uz compinit && compinit

autoload -Uz zrecompile
source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

typeset -i updated_at=$(date +'%j' -r $HOME/.zcompdump 2>/dev/null || stat -f '%Sm' -t '%j' $HOME/.zcompdump 2>/dev/null)
typeset -i today=$(date +'%j')
 
if [[ $updated_at -eq $today ]]; then
  compinit -C -i
else
  compinit -i
fi

zmodload -i zsh/complist
zstyle ':completion:*' menu select # select completions with arrow keys
zstyle ':completion:*' group-name '' # group results by category
zstyle ':completion:::::' completer _expand _complete _ignored _approximate # enable approximate matches for completion
setopt auto_list # automatically list choices on ambiguous completion
setopt auto_menu # automatically use menu completion
setopt always_to_end # move cursor to end if word had one match

# End of lines added by compinstall
eval "$(starship init zsh)"
eval "$(zoxide init zsh --cmd cd)"
source <(fzf --zsh)

if [[ -o interactive ]]; then
    fastfetch
fi

export BAT_THEME="Catppuccin_Mocha"

fg="#CBE0F0"
bg="#011628"
purple="#B388FF"
blue="#06BCE4"
cyan="#2CF9ED"

export FZF_DEFAULT_OPTS="--color=fg:${fg},bg:${bg},hl:${purple},fg+:${fg},bg+:${bg},hl+:${purple},info:${blue},prompt:${cyan},marker:${cyan},spinner:${cyan},header:${cyan}"

alias ls="eza --color=always --long --git --no-filesize --icons=always --no-time --no-user --no-permissions"
alias pactivate='source $(poetry env info --path)/bin/activate'


export FZF_CTRL_T_OPTS="--preview 'bat -n --color=always --line-range :500 {}'"
export FZF_ALT_C_OPTS="--preview 'eza --tree --color=always {} | head -200'"


_fzf_comprun() {
	local command=$1
	shift

	case "$command" in
		cd)	fzf --perview 'eza --tre --color=always {} | head -200' "$@" ;;
		export|unset) fzf --preview "eval 'echo \$' {}" ;;
		ssh)	fzf --preview "dig {}"	"$@" ;;
		*) fzf --preview "--preview 'bat -n --color=always --line-range :500 {}'" "$@" ;;
	esac
}


eval "$(thefuck --alias)"
eval "$(thefuck --alias fk)"

export EDITOR="nvim"

function y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	yazi "$@" --cwd-file="$tmp"
	if cwd="$(command cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
		builtin cd -- "$cwd"
	fi
	rm -f -- "$tmp"
}



ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#663399,standout"
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE="20"
ZSH_AUTOSUGGEST_USE_ASYNC=1

alias dotfiles='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'


# Created by `pipx` on 2025-09-13 15:23:35
export PATH="$PATH:/home/lesi-nedo/.local/bin:/home/lesi-nedo/.local/share/JetBrains/Toolbox/scripts"
. "$HOME/.cargo/env"
export PATH="$HOME/.npm-global/bin:$PATH"
