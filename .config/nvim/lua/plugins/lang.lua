return {
  { import = "lazyvim.plugins.extras.lang.typescript" },
  { import = "lazyvim.plugins.extras.lang.python" },
  { import = "lazyvim.plugins.extras.lang.rust" },
  { import = "lazyvim.plugins.extras.lang.clangd" },
  { import = "lazyvim.plugins.extras.lang.cmake" },
  { import = "lazyvim.plugins.extras.lang.json" },
  { import = "lazyvim.plugins.extras.lang.toml" },
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      opts.ensure_installed = opts.ensure_installed or {}
      vim.list_extend(opts.ensure_installed, {
        "bash",
        "c",
        "cmake",
        "comment",
        "cpp",
        "css",
        "dockerfile",
        "html",
        "javascript",
        "jsdoc",
        "json",
        "jsonc",
        "lua",
        "markdown",
        "markdown_inline",
        "python",
        "query",
        "regex",
        "rust",
        "tsx",
        "typescript",
        "vim",
        "vimdoc",
        "yaml",
      })
    end,
  },
  {
    "stevearc/conform.nvim",
    opts = function(_, opts)
      opts.formatters_by_ft = opts.formatters_by_ft or {}
      opts.formatters_by_ft.c = { "clang_format" }
      opts.formatters_by_ft.cpp = { "clang_format" }
      opts.formatters_by_ft.cuda = { "clang_format" }
      opts.formatters_by_ft.proto = { "clang_format" }
      opts.formatters_by_ft.javascript = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.javascriptreact = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.typescript = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.typescriptreact = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.json = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.jsonc = { "prettierd", "prettier", stop_after_first = true }
      opts.formatters_by_ft.python = { "ruff_organize_imports", "ruff_fix", "ruff_format" }
      opts.formatters_by_ft.rust = { "rustfmt" }
    end,
  },
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        pyright = {
          settings = {
            python = {
              analysis = {
                autoImportCompletions = true,
                autoSearchPaths = true,
                diagnosticMode = "workspace",
                typeCheckingMode = "basic",
                useLibraryCodeForTypes = true,
              },
            },
          },
        },
        ruff = {
          init_options = {
            settings = {
              organizeImports = true,
            },
          },
        },
        vtsls = {
          settings = {
            javascript = {
              suggest = {
                completeFunctionCalls = true,
              },
            },
            typescript = {
              suggest = {
                completeFunctionCalls = true,
              },
            },
          },
        },
      },
    },
  },
  {
    "mason-org/mason.nvim",
    opts = function(_, opts)
      opts.ensure_installed = opts.ensure_installed or {}
      vim.list_extend(opts.ensure_installed, {
        "clang-format",
        "clangd",
        "cmakelang",
        "codelldb",
        "prettier",
        "prettierd",
        "pyright",
        "ruff",
        "rust-analyzer",
        "stylua",
      })
    end,
  },
}
