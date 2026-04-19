-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
--
-- Add any additional autocmds here
-- with `vim.api.nvim_create_autocmd`
--
-- Or remove existing autocmds by their group name (which is prefixed with `lazyvim_` for the defaults)
-- e.g. vim.api.nvim_del_augroup_by_name("lazyvim_wrap_spell")
local lang_group = vim.api.nvim_create_augroup("user_language_defaults", { clear = true })

vim.api.nvim_create_autocmd("FileType", {
  group = lang_group,
  pattern = { "c", "cpp", "python", "rust" },
  callback = function(event)
    vim.bo[event.buf].expandtab = true
    vim.bo[event.buf].shiftwidth = 4
    vim.bo[event.buf].tabstop = 4
    vim.bo[event.buf].softtabstop = 4
  end,
})

vim.api.nvim_create_autocmd("FileType", {
  group = lang_group,
  pattern = {
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "json",
    "jsonc",
    "yaml",
    "toml",
  },
  callback = function(event)
    vim.bo[event.buf].expandtab = true
    vim.bo[event.buf].shiftwidth = 2
    vim.bo[event.buf].tabstop = 2
    vim.bo[event.buf].softtabstop = 2
  end,
})

vim.api.nvim_create_autocmd("FileType", {
  group = lang_group,
  pattern = { "markdown", "text", "gitcommit" },
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.spell = true
  end,
})
