# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vue 3 component library wrapping the SurveyJS creator (`survey-creator-vue` + `survey-vue3-ui`). Adds theming, modal/icon overlays, and bilingual (Persian/English with RTL) localization. Published to npm; built as UMD + ESM with type declarations. Vue, vue-i18n and the SurveyJS packages are **peer dependencies**, not bundled.

## Commands

- `pnpm dev` — Vite dev server for the playground in `demo/` (entry `demo/main.ts`, config `demo/vite.config.ts`): designer, fill and JSON tabs, sample surveys, the custom question types and logic registered with fake data, an AI mock, locale and dark-mode switches, and an event log. It imports the library from `src/index.ts`, so it exercises the public API; keep it in step when that changes.
- `pnpm build` — Vite library build + `vue-tsc` type declarations
- `pnpm build:types` — type declarations only
- `pnpm typecheck` — `vue-tsc` over the library and playground (`tsconfig.app.json`) and the tests (`tsconfig.test.json`)
- `pnpm test` — unit and component tests (Vitest, jsdom); `pnpm test:coverage` adds a coverage report in `coverage/`
- `pnpm test:package` — builds, then checks `dist/` as consumers get it (exports resolve, only peers are imported, CSS and `tailwind.css` complete, a strict TypeScript consumer type-checks, `npm pack` contents)
- `pnpm test:e2e` — Playwright against a running playground (`PLAYGROUND_URL`, default `http://localhost:5180`)
- `pnpm check` — typecheck + test + test:package; `prepublishOnly` runs it, so a publish with a failing check stops
- No linter or formatter is configured.

## Tests

- `tests/unit/` — one file per module or component. Components run against a real `SurveyCreatorModel` (`mountWithCreator` in `helpers.ts` provides it and vue-i18n); only `FormBuilder.test.ts` mocks SurveyJS's creator UI. `tests/setup.ts` stubs the browser APIs jsdom lacks.
- `locales.test.ts` fails when a component's `t("key")` is missing in `en` or `fa`, or the two languages' keys differ.
- `tests/publicApi.ts` lists the public exports; `exports.test.ts` and the package tests hold the build to it, so a new export goes there too.
- `tests/package/` needs `dist/`; `tests/e2e/` drives the playground through `fixtures.ts` (the `Playground` helpers), so e2e selectors track `demo/`.
- Every bug fixed so far has a regression test; add one with each fix.

## Code style

- TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports` all on).
- Vue 3 Composition API only, `<script setup lang="ts">`. Use `defineProps<>()` / `defineEmits<>()` generics.
- Theming: the SurveyJS light/dark themes follow the `dark` class on `<html>` (`useColorMode`). Hosts restyle SurveyJS through the `--color-formbilder-*`, `--font-formbilder-*` and `--radius-formbilder` variables, which `src/styles/sv-creator-bridge.css` maps onto SurveyJS variables. The result template, its editor and the toasts use Tailwind utilities with `fb-*` colours: the colours are registered in `src/styles/tailwind.css` (hosts import it into their Tailwind build) and set inline from the creator theme.
- Localization: component text lives in `src/locales/{en,fa}/*.json`, grouped in `src/locales/index.ts` and loaded per component with `useLocalI18n` (vue-i18n local scope; the host installs vue-i18n). Keep `en` and `fa` in step. SurveyJS strings go through `editorLocalization` (`src/utils/serilizers.ts`) and `survey-creator-core/i18n/persian`.

## Gotchas

- `.env` contains `NODE_AUTH_TOKEN` (npm publish credential). Never echo, commit, or include it in tool output.
- The peer dependencies (`vue`, `vue-i18n`, `survey-*`) are external in `vite.config.ts` and must stay so: survey-core and survey-creator-core keep global registries (`Serializer`, `ElementFactory`, `editorLocalization`), and a bundled second copy would not share them with the host. Their CSS is the exception and stays bundled into `form-builder.css`. A new peer goes in `peerDependencies`, `devDependencies` and the `peers` list.

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
