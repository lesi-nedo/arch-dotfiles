-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
local opt = vim.opt

opt.clipboard = "unnamedplus"
opt.scrolloff = 8
opt.sidescrolloff = 8
opt.wrap = false
opt.splitbelow = true
opt.splitright = true
opt.timeoutlen = 300
opt.updatetime = 200
opt.cursorline = true

vim.g.autoformat = true
