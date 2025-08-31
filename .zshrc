
# The following lines were added by compinstall

zstyle ':completion:*' completer _expand _complete _ignored _approximate
zstyle ':completion:*' matcher-list '' '+m:{[:lower:]}={[:upper:]}' 'l:|=* r:|=*' '+r:|[_]=** r:|=**'
zstyle ':completion:*' max-errors 2 numeric
zstyle :compinstall filename '/home/lesi-nedo/.zshrc'

autoload -Uz compinit
compinit
# End of lines added by compinstall
# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=1000
setopt autocd notify
unsetopt beep
bindkey -v
# End of lines configured by zsh-newuser-install

alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias dotfiles='/usr/bin/git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
