# Survey Model Provider + Inject Pattern

> **Status: superseded.** `provideSurveyConfig` was built (f286b20) and later
> removed (91a4b17, "fix: remove surveyConfig"). The shipped
> `useSurveyModel(json?)` needs no provider: it follows the `dark` class on
> `<html>` and the vue-i18n locale (`src/composables/useSurveyModel.ts`), and
> hosts restyle SurveyJS through the `--color-formbilder-*` CSS variables.
> Kept as a design record.

## Goal

Eliminate the per-host `useSurveyModel` helper. The library should expose a
provider that the host sets up once (reactive theme mode + CSS variables) and a
consumer composable that builds a `Model`, sets locale, wires scroll-to-error,
and reactively re-applies the theme whenever mode flips.

## Motivation

Today every host duplicates the same boilerplate:

```ts
const survey = new Model(jsonObj);
const colorMode = useColorMode();
survey.locale = 'fa';
const { SurveyDarkTheme, SurveyLightTheme } = getThemes(SurveyCssVariable);
useScrollToError(survey);
watch([colorMode], () => {
  survey.applyTheme(colorMode.value === 'dark' ? SurveyDarkTheme : SurveyLightTheme);
}, { immediate: true });
```

Each consumer of the library re-implements this. The CSS variables and
color-mode source rarely change across the host app, so they belong in a
provider at the app root.

## Design

### Public API

Two new exports from `@yonus_amire01/form-builder`:

```ts
function provideSurveyConfig(config: {
  mode: Ref<ThemeModes> | ComputedRef<ThemeModes>;
  cssVariable: CssVariables;
}): void;

function useSurveyModel(json: object | undefined): Model | undefined;
```

`mode` MUST be reactive (a `Ref`/`ComputedRef`) so theme toggling re-themes
every live Model without further plumbing. `cssVariable` is plain (static) —
design tokens are not expected to change at runtime.

### Host usage

```ts
// app root (e.g. main.ts, App.vue setup, or a Nuxt plugin)
import { provideSurveyConfig } from '@yonus_amire01/form-builder';
import { SurveyCssVariable } from '@/utils/survey-themes/themes';

provideSurveyConfig({
  mode: useColorMode(), // any reactive ref returning 'dark' | 'light'
  cssVariable: SurveyCssVariable,
});

// anywhere downstream
import { useSurveyModel } from '@yonus_amire01/form-builder';
const survey = useSurveyModel(jsonObj);
```

The host-side `useSurveyModel` helper file is deleted.

### Internals

#### `src/composables/useSurveyConfig.ts` (new)

```ts
import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';
import type { CssVariables, ThemeModes } from '../types/types';

export type SurveyConfig = {
  mode: Ref<ThemeModes> | ComputedRef<ThemeModes>;
  cssVariable: CssVariables;
};

const SURVEY_CONFIG_KEY: InjectionKey<SurveyConfig> = Symbol('survey_config');

export function provideSurveyConfig(config: SurveyConfig) {
  provide(SURVEY_CONFIG_KEY, config);
}

export function useSurveyConfig(): SurveyConfig {
  const config = inject(SURVEY_CONFIG_KEY);
  if (!config) {
    throw new Error(
      'useSurveyModel() called without provideSurveyConfig() in an ancestor',
    );
  }
  return config;
}
```

#### `src/composables/useSurveyModel.ts` (new)

```ts
import { Model } from 'survey-core';
import { watch } from 'vue';
import { getServeyTheme } from '../themes';
import { Locales } from '../types/types';
import { useSurveyConfig } from './useSurveyConfig';
import useScrollToError from './useScrollToError';

export default function useSurveyModel(json: object | undefined): Model | undefined {
  if (!json) return;

  const { mode, cssVariable } = useSurveyConfig();
  const survey = new Model(json);

  survey.locale = Locales.fa;
  useScrollToError(survey);

  watch(
    mode,
    (m) => {
      survey.applyTheme(getServeyTheme({ mode: m, cssVariable }) as any);
    },
    { immediate: true },
  );

  return survey;
}
```

Notes:
- `mode` accepts a single ref (not an array), so `watch(mode, ...)` works
  directly with `immediate: true`.
- `applyTheme` is cast `as any` to match the existing pattern in
  `useTheme.ts:9` — the surveyjs theme typings are narrower than the
  variables-merged shape we produce.
- Locale is hardcoded to `Locales.fa` to mirror the host helper exactly. If a
  future caller needs per-model locale override, add a second argument later.
- When `json` is undefined the function returns `undefined`, preserving the
  drop-in behavior of the host helper.

#### `src/index.ts` (edit)

Add:

```ts
export { provideSurveyConfig } from './composables/useSurveyConfig';
export { default as useSurveyModel } from './composables/useSurveyModel';
```

## Non-goals

- Replacing or removing `SurveProvideTheme` / `useSurveyTheme` /
  `SurveCreatorProvideTheme` / `useSurveyCreatorTheme`. Those serve the
  creator UI and may still be used directly by `FormBuilder`. The new pair is
  additive.
- Providing the locale through the new config. Locale stays hardcoded to `fa`
  inside `useSurveyModel` — global `setupLocale` in `src/index.ts:12` already
  handles app-wide locale registration.
- A `<SurveyModelProvider>` wrapper component. Functional `provide` matches
  the existing style in `useTheme.ts` and is enough.
- Plugin-based registration via `app.use(...)`. Out of scope; can be added
  later as a thin wrapper if hosts want it.

## Verification

- `pnpm build` — must succeed (`vue-tsc` catches type errors; this project
  has no test/lint commands per `CLAUDE.md`).
- Manual: in the demo (`src/main.ts`), wire `provideSurveyConfig` with a
  toggleable `ref<ThemeModes>` and confirm the rendered survey re-themes on
  toggle.

## Out-of-scope follow-ups

- Optional per-call locale override.
- Optional `scrollToError: boolean` flag on the config.
- A wrapper component or Vue plugin install for hosts that prefer those
  styles.
