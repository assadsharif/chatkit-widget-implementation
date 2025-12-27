# Tooling Decisions

**Purpose**: Document tooling choices made during implementation setup.

---

## Node Version

**Decision**: Node.js 20.11.0 (LTS)

**Rationale**:
- Matches design requirement: "Node.js 20+" (from README)
- LTS version (stable, long-term support)
- Documented in `.nvmrc` for consistency

**Enforcement**: `.nvmrc` file locks version

---

## Package Manager

**Decision**: npm (not pnpm, not yarn)

**Rationale**:
- Design repository uses npm (consistency)
- Simpler setup (no additional tool installation)
- package.json already specifies "npm 10+"
- Monorepo support via workspaces is sufficient

**Enforcement**: `package.json` engines field

---

## Code Formatting

**Tool**: Prettier

**Configuration**: `.prettierrc`
- Semi-colons: Yes (consistency with TypeScript)
- Single quotes: Yes (common TS convention)
- Tab width: 2 spaces (matches .editorconfig)
- Trailing commas: ES5 (safer git diffs)
- Print width: 100 (readable, not too wide)
- Arrow parens: Always (explicit)

**Enforcement**: Pre-commit hook (future)

---

## Linting

**Tool**: ESLint + TypeScript ESLint + React plugins

**Configuration**: `.eslintrc.json`
- Extends: eslint:recommended, @typescript-eslint/recommended, react, react-hooks
- Parser: @typescript-eslint/parser
- Rules:
  - `react/react-in-jsx-scope`: Off (React 17+ doesn't need it)
  - `@typescript-eslint/explicit-module-boundary-types`: Off (inferred types are fine)
  - `@typescript-eslint/no-explicit-any`: Warn (discourage, but don't block)

**Enforcement**: CI/CD (future)

---

## Editor Consistency

**Tool**: EditorConfig

**Configuration**: `.editorconfig`
- Indent: 2 spaces
- End of line: LF (Unix-style)
- Charset: UTF-8
- Trim trailing whitespace: Yes (except Markdown)
- Insert final newline: Yes

**Enforcement**: Most IDEs auto-detect .editorconfig

---

## Why Minimal?

This baseline provides **consistency without opinions**.

- No Husky (yet) - add when needed
- No lint-staged (yet) - add when needed
- No commitlint (yet) - add when needed

**Principle**: Add tools only when they solve a real problem.

---

**Last Updated**: 2025-12-27
