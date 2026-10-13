# jbh-app — Agent instructions

The project rules live in `.claude/CLAUDE.md`. Read it before you change code.

## Pipeline config (kkpa-orchestrate-change)

- **Modules-Root:** `src/`
- **Doc-Pack:** `.claude/CLAUDE.md`, `.claude/docs/architecture.md`, `.claude/docs/theming.md`,
  `.claude/docs/forms.md`
- **Test-Execution-Policy:** `assistant MAY run eslint only (npx eslint <paths> or npx ng lint)
  — a static check that builds nothing. Never ng build, ng test, npm test, npm run build,
  ionic build or ionic serve: the user runs builds and tests and reports the results.`
- **Design-Gates:** `database`
- **Git-Strategy:** `auto`
