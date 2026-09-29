# Survey Model Provider Implementation Plan

> **Status: superseded.** See the note at the top of the
> [spec](../specs/2026-06-17-survey-model-provider-design.md):
> `provideSurveyConfig` was removed in 91a4b17, and `useSurveyModel` works
> without a provider. Kept as a record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `provideSurveyConfig` + `useSurveyModel` composable pair so host apps stop writing the per-project survey-model helper.

**Architecture:** Two new composables in `src/composables/`. `provideSurveyConfig` stores a reactive `mode` ref and static `cssVariable` on a Symbol injection key. `useSurveyModel` injects that config, constructs a `Model`, sets locale, wires `useScrollToError`, and `watch`es `mode` to call `survey.applyTheme(getServeyTheme(...))`. Both are re-exported from `src/index.ts`.

**Tech Stack:** Vue 3 Composition API, TypeScript strict, `survey-core`, existing `src/themes/index.ts` helpers. **No test runner exists in this repo** (per `CLAUDE.md`) — verification is `pnpm build` (runs `vue-tsc`). Plan deviates from default TDD pattern accordingly.

**Spec:** `docs/superpowers/specs/2026-06-17-survey-model-provider-design.md`

---

## File Structure

| File | Action | Responsibility |
| ---- | ------ | -------------- |
| `src/composables/useSurveyConfig.ts` | Create | Injection key + `provideSurveyConfig` + internal `useSurveyConfig` |
| `src/composables/useSurveyModel.ts` | Create | Consumer composable — builds `Model`, wires locale, scroll-to-error, reactive theme |
| `src/index.ts` | Modify | Re-export `provideSurveyConfig` and `useSurveyModel` |

No existing files are restructured. The new composables sit alongside `useTheme.ts`, `useScrollToError.ts`, `useSurveyCreator.ts`, etc.

---

### Task 1: Create `useSurveyConfig` (provider + injector)

**Files:**
- Create: `src/composables/useSurveyConfig.ts`

- [ ] **Step 1: Write the file**

```ts
import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from "vue";
import type { CssVariables, ThemeModes } from "../types/types";

export type SurveyConfig = {
  mode: Ref<ThemeModes> | ComputedRef<ThemeModes>;
  cssVariable: CssVariables;
};

const SURVEY_CONFIG_KEY: InjectionKey<SurveyConfig> = Symbol("survey_config");

export function provideSurveyConfig(config: SurveyConfig) {
  provide(SURVEY_CONFIG_KEY, config);
}

export function useSurveyConfig(): SurveyConfig {
  const config = inject(SURVEY_CONFIG_KEY);
  if (!config) {
    throw new Error(
      "useSurveyModel() called without provideSurveyConfig() in an ancestor",
    );
  }
  return config;
}
```

Notes:
- Import style (double quotes, `type` modifier on type-only imports, no semicolon-less style) matches existing `src/composables/useTheme.ts:1-3`.
- `mode` is typed as `Ref<ThemeModes> | ComputedRef<ThemeModes>` so hosts can pass either `ref('dark')` or `computed(() => colorMode.value)`.
- Error message names `useSurveyModel` because that's the only intended consumer; mirroring the wording style of `useTheme.ts:16`.

- [ ] **Step 2: Verify file compiles in isolation (no commit yet)**

Run: `pnpm build:types`
Expected: completes with no errors mentioning `useSurveyConfig.ts`. (Build may still fail later because the file is not yet exported — that's fine; we are checking the file itself typechecks.)

---

### Task 2: Create `useSurveyModel` (consumer composable)

**Files:**
- Create: `src/composables/useSurveyModel.ts`

- [ ] **Step 1: Write the file**

```ts
import { Model } from "survey-core";
import { watch } from "vue";
import { getServeyTheme } from "../themes";
import { Locales } from "../types/types";
import { useSurveyConfig } from "./useSurveyConfig";
import useScrollToError from "./useScrollToError";

export default function useSurveyModel(
  json: object | undefined,
): Model | undefined {
  if (!json) return;

  const { mode, cssVariable } = useSurveyConfig();
  const survey = new Model(json);

  survey.locale = Locales.fa;
  useScrollToError(survey);

  watch(
    mode,
    (m) => {
      survey.applyTheme(
        getServeyTheme({ mode: m, cssVariable }) as any,
      );
    },
    { immediate: true },
  );

  return survey;
}
```

Notes:
- `Locales.fa` (enum) is used rather than the string `"fa"` so future locale changes in `src/types/types.ts:5-8` propagate.
- `applyTheme(... as any)` mirrors the existing cast pattern in `src/composables/useTheme.ts:9` — surveyjs's `ITheme` type is narrower than the merged shape from `getServeyTheme`. Do not "improve" this — it intentionally matches established usage.
- The watcher uses `watch(mode, callback, { immediate: true })` directly (no array). This subscribes to a single ref and fires once at setup, then on each change.
- Default-export matches the convention of sibling composable `useScrollToError.ts:3`.

- [ ] **Step 2: Verify file compiles in isolation**

Run: `pnpm build:types`
Expected: completes without errors referencing `useSurveyModel.ts`. (Same caveat as Task 1 — full library build comes after the export wiring.)

---

### Task 3: Export both from the library entrypoint

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add two new exports**

Open `src/index.ts`. After the existing `export * from "./composables/useTheme.ts";` line (currently `src/index.ts:23`), add:

```ts
export { provideSurveyConfig } from "./composables/useSurveyConfig";
export { default as useSurveyModel } from "./composables/useSurveyModel";
```

Final state of the export block (for reference — do not delete existing exports):

```ts
export type { CssVariables } from "./types/types";
export { SurveyComponent } from "survey-vue3-ui";
export * from "./themes/index.ts";
export * from "./composables/useTheme.ts";
export { provideSurveyConfig } from "./composables/useSurveyConfig";
export { default as useSurveyModel } from "./composables/useSurveyModel";
export type * from "./types/lonic";
export * from "survey-core";

export { FormBuilder, SurveySchemaPrompt, useScrollToError };
```

Notes:
- We use explicit named re-exports rather than `export * from` because each new file exports more than one symbol (`useSurveyConfig.ts` also has the internal `useSurveyConfig`, which we intentionally do NOT expose).
- File extensions on import paths: existing lines use both styles (`./composables/useTheme.ts` with extension on line 23, `./components/FormBuilder.vue` with extension on line 3, `./composables/useScrollToError` without on line 1). The new lines omit the extension to match `useScrollToError`'s style for plain `.ts` composables.

- [ ] **Step 2: Run the full type build**

Run: `pnpm build:types`
Expected: completes with no errors.

If errors appear, the most likely causes are:
- Path typos in the new import lines.
- A mismatch between `ThemeModes` (an enum) and a string literal type the host passes — but at this stage no host code exists, so this would be internal only.

---

### Task 4: Full library build

**Files:** none

- [ ] **Step 1: Run `pnpm build`**

Run: `pnpm build`
Expected: succeeds. This runs Vite library build + `vue-tsc` and is the project's only verification command (per `CLAUDE.md`).

If it fails, do NOT skip with `--no-verify` later — diagnose the underlying error.

---

### Task 5: Commit

**Files:** all of the above + spec + plan

- [ ] **Step 1: Stage only the intended files**

```bash
git add \
  src/composables/useSurveyConfig.ts \
  src/composables/useSurveyModel.ts \
  src/index.ts \
  docs/superpowers/specs/2026-06-17-survey-model-provider-design.md \
  docs/superpowers/plans/2026-06-17-survey-model-provider.md
```

Do not use `git add -A` — the working tree has pre-existing unrelated `M`/`A` changes (see initial `git status`).

- [ ] **Step 2: Verify staged contents**

Run: `git status` and `git diff --cached --stat`
Expected: exactly the five files above appear as staged. No `.env`, no `*.tgz`, no unrelated `src/**/*.vue` edits.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add provideSurveyConfig + useSurveyModel composables

Provider+inject pair so host apps configure reactive theme mode and CSS
variables once, then call useSurveyModel(json) instead of re-implementing
the new Model / locale / scroll-to-error / theme-watcher boilerplate.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Confirm commit landed**

Run: `git log -1 --stat`
Expected: shows the new commit with the five files.

---

## Verification summary

- **Type check:** `pnpm build:types` after Tasks 1, 2, 3 — each must pass.
- **Library build:** `pnpm build` in Task 4 — must pass.
- **Manual smoke (out of scope for this plan, host responsibility):** in a host app, call `provideSurveyConfig({ mode: useColorMode(), cssVariable: SurveyCssVariable })` once at root, then `useSurveyModel(json)` and toggle the color mode — the survey should re-theme without page reload.

## Out-of-scope follow-ups (do NOT add to this plan)

- Per-call locale override on `useSurveyModel`.
- Optional `scrollToError` flag.
- `<SurveyModelProvider>` wrapper component or `app.use(...)` plugin install.
- Updating `src/main.ts` demo to use the new pair — leave demo unchanged for now.
