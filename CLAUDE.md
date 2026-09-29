# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vue 3 component library wrapping the SurveyJS creator (`survey-creator-vue` + `survey-vue3-ui`). Adds theming, modal/icon overlays, and bilingual (Persian/English with RTL) localization. Published to npm; built as UMD + ESM with type declarations. Vue, vue-i18n and the SurveyJS packages are **peer dependencies**, not bundled.

## Commands

- `pnpm dev` — Vite dev server for the demo app in `demo/` (entry `demo/main.ts`, config `demo/vite.config.ts`)
- `pnpm build` — Vite library build + `vue-tsc` type declarations
- `pnpm build:types` — type declarations only
- **No tests, no linter, no formatter configured.** Do not invent `pnpm test` / `pnpm lint` — they do not exist. If verification is needed, run `pnpm build` (catches type errors via `vue-tsc`).

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
