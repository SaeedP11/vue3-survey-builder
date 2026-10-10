# 🧱 Form Builder

> A powerful, AI-assisted, drag-and-drop form builder Vue 3 component library — built on top of [SurveyJS](https://surveyjs.io/), with full **Persian (Farsi) / English** bilingual support and **AI-powered form generation**.

[![npm version](https://img.shields.io/npm/v/vue3-survey-builder?color=2dd4bf&label=npm)](https://www.npmjs.com/package/vue3-survey-builder)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

- 🎨 **Visual drag-and-drop form designer** powered by SurveyJS Creator
- 🤖 **AI-driven form generation** — describe your form in natural language; your app calls the model and returns the JSON schema
- 🧾 **Highlighted JSON editor** — the designer's JSON Editor tab colours the JSON and formats it (toolbar button or Shift+Alt+F)
- 📈 **Chart question** — a built-in, display-only bar, line or donut chart of the answers, live as the form is filled
- 📊 **Result templates** — a score card for completed surveys, configured and previewed in the designer
- 🔌 **Custom question types and logic** — async dropdowns, designer-only pickers, custom Conditional Logic triggers
- 🌗 **Dark & Light themes**, following the `dark` class on `<html>`
- 🌐 **Bilingual support** — Persian (Farsi) & English
- 🖼️ **Icon Picker** — a Lucide icon for the survey logo, picked from the survey header
- 📦 **Dual build output** — ESM (`.mjs`) + UMD (`.umd.js`) + TypeScript declarations

---

## 📦 Installation

The SurveyJS packages, Vue, vue-i18n and Tailwind are peer dependencies,
shared with your app rather than bundled. pnpm and npm install missing
peers automatically; with yarn, or with peer auto-install turned off,
add them yourself:

```bash
pnpm add vue3-survey-builder

# only if your package manager does not install peers:
pnpm add survey-core survey-creator-core survey-creator-vue survey-vue3-ui vue vue-i18n tailwindcss
```

survey-core and survey-creator-core keep global registries (custom
properties, question types, locale strings), so the app and this library
must share one copy. Import SurveyJS APIs from either package: this library
re-exports `survey-core`.

---

## 🚀 Usage

The components translate their own text with vue-i18n, so the app must
install it (Composition API mode). Its current locale (`en` or `fa`) also
drives the SurveyJS locale.

```ts
// main.ts
import { createI18n } from "vue-i18n";

app.use(createI18n({ legacy: false, locale: "fa", messages: {} }));
```

### Designer

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  FormBuilder,
  SurveySchemaPrompt,
  provideAiAssistantConfig,
} from "vue3-survey-builder";
import "vue3-survey-builder/style.css";

const json = ref<object>({});

// Optional: the toolbar's AI button sends the prompt here. Return the survey
// JSON (or a Promise of it); return undefined to leave the form unchanged.
provideAiAssistantConfig({
  onSubmit: async (prompt) => {
    const messages = [...SurveySchemaPrompt, { role: "user", content: prompt }];
    const reply = await callYourModel(messages); // your LLM call
    return JSON.parse(reply.match(/\[JSON\]([\s\S]*?)\[\/JSON\]/)![1]);
  },
});
</script>

<template>
  <FormBuilder v-model:json="json" />
</template>
```

`v-model:json` receives the survey JSON on every autosave, and setting it
loads a new schema into the designer. `SurveySchemaPrompt` is a few-shot
prompt that makes a model answer in the `[JSON]…[/JSON]` format above.

#### Text direction

The designer follows the locale's direction: right to left in `fa` (and
other RTL languages), left to right in `en`, switching with the locale. Pass
`dir="ltr"` or `dir="rtl"` to fix it instead. SurveyJS mounts its popups on
`<body>` and reads their direction from it, so keep `<html dir>` in step with
the locale (a Nuxt i18n app does this) for menus and dropdowns to match.

### Filling a survey

```vue
<script setup lang="ts">
import { SurveyComponent, useSurveyModel } from "vue3-survey-builder";
import "vue3-survey-builder/style.css";

const survey = useSurveyModel(surveyJson);
survey.onComplete.add((sender) => save(sender.data));
</script>

<template>
  <SurveyComponent :model="survey" />
</template>
```

`useSurveyModel` builds the `Model`, keeps its locale and theme in step with
the app, and scrolls to the first invalid question on validation. It must be
called from a component's `setup()`. A Persian survey renders right to left on
its own; an English one takes the page's direction.

---

## 🎨 Styling

Import the library stylesheet where you use the components:

```ts
import "vue3-survey-builder/style.css";
```

Some components (the result template, its editor and the toasts) are styled
with Tailwind v4 utilities, which your app's Tailwind build generates. Add
the library's Tailwind entry to your app's CSS, after Tailwind itself:

```css
@import "tailwindcss";
@import "vue3-survey-builder/tailwind.css";
```

It names the library's sources for Tailwind to scan (Tailwind skips
`node_modules` otherwise) and registers the `fb-*` colours those components
use.

To match the designer and surveys to your app's palette, set these CSS
variables (for example on `:root`, and again under `.dark`); `style.css`
maps them onto SurveyJS's own variables:

| Variable | Used for |
| -------- | -------- |
| `--color-formbilder-background` | Page and input backgrounds |
| `--color-formbilder-surface-background` | Panels and the designer surface |
| `--color-formbilder-primary` | Brand and accent colour |
| `--color-formbilder-error`, `--color-formbilder-error-light` | Validation errors |
| `--font-formbilder-family`, `--font-formbilder-size`, `--font-formbilder-question-size`, `--font-formbilder-weight` | Typography |
| `--radius-formbilder` | Corner radius of forms, inputs and buttons |
| `--color-formbilder-json-key`, `-string`, `-number`, `-boolean`, `-null`, `-punctuation`, `-comment` | Token colours in the JSON Editor tab (light and dark defaults otherwise) |

---

## 🔌 Async Dropdown (custom question)

Register a server-driven dropdown question that the form designer and the
rendered survey can both use. Search, pagination, and item state are owned
by your app; the component just renders them and calls your handlers.

### 1. Register the question

`registerAsyncDropdown()` uses `getCurrentInstance()` internally, so you
**must call it from inside a component's `setup()`** (or `<script setup>`)
— typically the same parent that mounts `FormBuilder`.

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  FormBuilder,
  registerAsyncDropdown,
  type ItemType,
} from "vue3-survey-builder";

const items = ref<ItemType[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
let lastQuery = "";

async function load(query: string, page: number) {
  const res = await fetch(
    `/api/items?q=${encodeURIComponent(query)}&page=${page}`,
  );
  const data = await res.json();
  items.value = data.items;          // [{ value, text }, ...]
  currentPage.value = data.page;
  totalPages.value = data.totalPages;
  lastQuery = query;
}

registerAsyncDropdown("asyncDropdown", {
  items,
  currentPage,
  totalPages,
  handleSearch: (q) => load(q, 1),
  handleNextPage: () => load(lastQuery, currentPage.value + 1),
  handlePrevPage: () => load(lastQuery, currentPage.value - 1),
});

// optional: prime the list
load("", 1);
</script>

<template>
  <FormBuilder />
</template>
```

### 2. Use it in a survey JSON

The first argument to `registerAsyncDropdown` (`"asyncDropdown"` above) is
the question `type`. Reference it in any survey JSON:

```json
{
  "elements": [
    {
      "type": "asyncDropdown",
      "name": "country",
      "title": "Country"
    }
  ]
}
```

### Handler contract

The same `AsyncDropdownHandlers` interface is used by both
`registerAsyncDropdown` and [`registerAdvancedTextInput`](#-advanced-text-input-designer-only-async-dropdown).

| Field            | Type                                            | Notes                                                                                  |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `items`          | `Ref<ItemType[]>`                               | Current page of options — `{ value, text }`                                            |
| `currentPage`    | `Ref<number>`                                   | 1-based current page                                                                   |
| `totalPages`     | `Ref<number>`                                   | Total page count; set `0` to hide the pager                                            |
| `handleSearch`   | `(query: string) => void`                       | Called on every keystroke — debounce if needed                                         |
| `handleNextPage` | `() => void`                                    | Called when the next button is pressed                                                 |
| `handlePrevPage` | `() => void`                                    | Called when the previous button is pressed                                             |
| `onSelect?`      | `(question: Question, item: ItemType) => void`  | **Only invoked by `registerAdvancedTextInput`** — ignored by the runtime dropdown      |

> ⚠️ `items`, `currentPage`, and `totalPages` **must be Vue `Ref`s** —
> the component reads `.value` and re-renders reactively when you mutate them.

---

## 📝 Advanced Text Input (designer-only async dropdown)

`registerAdvancedTextInput` registers a question that **renders as a
regular text input at runtime**, but whose **`convertInputType` button
in the form designer** opens your async dropdown instead of the default
subtype list. When the designer picks an item, your `onSelect` callback
runs and can mutate the question — e.g. set `name` and `title` from the
chosen item.

Use this when you want the form designer to choose from a server-backed
catalogue (FHIR codes, country lists, glossary terms…) but want
end-users to type freely into a normal text field.

### 1. Register the type

Same `AsyncDropdownHandlers` shape as `registerAsyncDropdown`, plus the
optional `onSelect`. Must be called from a component's `setup()`.

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import {
  FormBuilder,
  registerAdvancedTextInput,
  type AsyncDropdownHandlers,
  type ItemType,
} from "vue3-survey-builder";

const COUNTRIES: ItemType[] = [
  { value: "IR", text: "Iran" },
  { value: "US", text: "United States" },
  { value: "GB", text: "United Kingdom" },
  // …
];

const PAGE_SIZE = 5;
const query = ref("");
const currentPage = ref(1);

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim();
  return q
    ? COUNTRIES.filter((c) => c.text.toLowerCase().includes(q))
    : COUNTRIES;
});
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)),
);
const items = computed(() =>
  filtered.value.slice(
    (currentPage.value - 1) * PAGE_SIZE,
    currentPage.value * PAGE_SIZE,
  ),
);

const handlers: AsyncDropdownHandlers = {
  items,
  currentPage,
  totalPages,
  handleSearch: (q) => {
    query.value = q;
    currentPage.value = 1;
  },
  handleNextPage: () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
  },
  handlePrevPage: () => {
    if (currentPage.value > 1) currentPage.value--;
  },
  // designer-only — runs when an item is picked from the convertInputType popup
  onSelect: (question, item) => {
    question.name = item.value;
    question.title = item.text;
  },
};

registerAdvancedTextInput("countryAsync", handlers);
</script>

<template>
  <FormBuilder />
</template>
```

### 2. Use the type in survey JSON

```json
{
  "elements": [
    { "type": "countryAsync", "name": "country" }
  ]
}
```

In the designer, click the question's **convertInputType** button (the
chevron next to the type label) — your async list pops up. Pick an
item, and:

- the question's properties update via your `onSelect`,
- the popup closes,
- the selection is highlighted on next open, and
- the action button's title becomes the selected item's `text`.

At runtime the question is a plain text input — the popup never appears.

### How it differs from `registerAsyncDropdown`

| Aspect                   | `registerAsyncDropdown`                    | `registerAdvancedTextInput`                              |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------- |
| Runtime render           | Custom dropdown Vue component              | Native text input (`survey-text`)                        |
| Where the user picks     | At survey-fill time                        | In the designer's `convertInputType` popup               |
| What selection does      | Sets `question.value = item.value`         | Calls `handlers.onSelect(question, item)` — you decide   |
| `onSelect` handler       | Ignored                                    | Required for anything to happen                          |

### Internals (for the curious)

- The popup component (`survey-text-input-popup`) is registered
  globally on the active Vue app on first call.
- `QuestionAdornerViewModel.prototype.createConvertInputType` is
  monkey-patched **once** to swap in the async popup for questions
  registered through this helper. Other question types keep their
  default behaviour.
- The registered class extends `QuestionTextModel` and overrides
  `getType()` (so the JSON round-trips with your custom type),
  `getTemplate()` / `getCssType()` → `"text"` (so SurveyJS renders +
  styles it as a regular text input).

---

## 🧠 Custom Logic (Conditional Logic tab)

`registerCustomLogic` adds a new entry to the form designer's
**Conditional Logic** tab — alongside the built-in *Skip to question*,
*Complete survey*, *Set answer*, etc. The user picks it from the action
dropdown, types an expression, and the survey JSON gains a matching
entry in its `triggers` array:

```json
"triggers": [
  { "type": "reminder", "expression": "{question1} = 10" }
]
```

An optional `onFire` callback runs at survey-fill time the moment the
expression flips to `true`, so you can react in the host app (toast,
log, emit an event, schedule a notification, …).

### 1. Register the logic type

Unlike `registerAsyncDropdown` / `registerAdvancedTextInput`, this
helper does **not** need a Vue component context — call it at module
load time, before the creator is instantiated:

```ts
import { registerCustomLogic } from "vue3-survey-builder";

registerCustomLogic({
  type: "reminder",
  locales: {
    en: {
      displayName: "Reminder",
      description: "Send a reminder when the condition is met",
    },
    fa: {
      displayName: "یادآور",
      description: "ارسال یادآور هنگام برقراری شرط",
    },
  },
  onFire: ({ survey, expression, properties }) => {
    console.log("[reminder] fired:", expression, survey.data, properties);
  },
});
```

The label shown in the Logic-tab dropdown (`displayName`) and the help
text below it (`description`) automatically switch with the creator's
current locale.

### 2. Use it in the designer

Open the **Logic** tab, click *Add New*, set a condition, then pick
*Reminder* (or whatever you named it) from the action dropdown. Save —
the produced survey JSON contains a trigger of your custom `type`.

### 3. React at runtime (optional)

When the survey is filled and the trigger's `expression` evaluates to
`true`, your `onFire` callback runs with:

| Field        | Type                       | Notes                                            |
| ------------ | -------------------------- | ------------------------------------------------ |
| `survey`     | `SurveyModel`              | The live survey instance — read `survey.data`    |
| `expression` | `string`                   | The expression text the user authored            |
| `properties` | `Record<string, unknown>`  | SurveyJS-supplied context (keys, navigation, …)  |

If `onFire` is omitted the trigger is JSON-only — your app can still
inspect `survey.triggers` itself.

### API

```ts
interface RegisterCustomLogicOptions {
  type: string;                       // value placed in triggers[].type
  locales: Record<                    // per-locale label + description
    string,
    { displayName: string; description?: string }
  >;
  onFire?: (ctx: {                    // optional runtime hook
    survey: SurveyModel;
    expression: string;
    properties: Record<string, unknown>;
  }) => void;
}
```

The call is **idempotent** — re-invoking with the same `type` updates
only the `onFire` handler; the serializer class, Logic-tab entry, and
locale strings are added once.

### Internals (for the curious)

- A `SurveyTrigger` subclass is registered with survey-core's
  `Serializer` (parent `"surveytrigger"`, single `expression` property)
  so JSON round-trips with `{ "type": "<your type>", "expression": "…" }`.
- A `trigger_<type>` entry is pushed into `SurveyLogic.types`
  (publicly-exposed static accessor), which is what the Logic-tab
  dropdown reads.
- Display strings are merged into `editorLocalization` under
  `lg.trigger_<type>Name` / `lg.trigger_<type>Description` — the same
  keys the built-in triggers use, so locale switching just works.
- `onFire` is wired to the trigger's `onSuccess` hook (fires only when
  the expression result transitions from `false` → `true`, per
  SurveyJS semantics).

---


## 📈 Chart question (built in)

A display-only question that charts numbers the form already holds. It is
built in: importing the library registers it, so the designer's toolbox
lists **Chart** and every survey rendered with `SurveyComponent` draws it,
with nothing to call.

Each data row is a label and a SurveyJS expression evaluated against the
answers as the respondent fills the form: a question (`{weight}`), a
calculation (`{a} + {b}`, `min(100, {steps} * 10)`), a calculated value or a
constant. A row whose expression names an unanswered question stays empty
instead of drawing a zero. The chart adds nothing to the survey's data and
never blocks completion.

```json
{
  "type": "chart",
  "name": "today",
  "title": "Today at a glance",
  "chartType": "bar",
  "unit": "h",
  "maxValue": 12,
  "items": [
    { "value": "sleep", "text": "Sleep", "expression": "{sleep}" },
    { "value": "goal", "text": "Goal", "expression": "8", "color": "#1baf7a" }
  ]
}
```

| Property    | Values                                          | Default |
| ----------- | ----------------------------------------------- | ------- |
| `chartType` | `bar`, `horizontalBar`, `line`, `donut`         | `bar`   |
| `items`     | `{ value, text, expression, color? }[]`         | `[]`    |
| `unit`      | text after each value (`kg`, `%`, ...)          |         |
| `maxValue`  | top of the value axis; empty fits the data      |         |

- Bars and lines use one colour (the first palette slot, or a row's
  `color`); a donut gives each slice the next slot of a fixed eight-colour,
  colour-blind-checked palette, with light and dark steps that follow the
  `dark` class on `<html>`. A ninth slice and later fold into "Other".
- Hovering or focusing a bar, point or slice shows its value; each chart
  carries a screen-reader summary and a hidden table of its numbers.
- Right-to-left forms put the value axis on the right; numbers are
  formatted for vue-i18n's locale (Persian digits in `fa`).
- In the designer the chart shows sample numbers, labelled as such.
- `QuestionChartModel` and `ChartItemValue` are exported for code that
  builds or inspects chart questions.

---

## 📊 Result template

The designer toolbar's **desktop** button opens the result-template editor:
a live preview on the left, settings on the right. The settings are stored
in the survey JSON under `resultTemplate` (a hidden survey property):

| Setting | Notes |
| ------- | ----- |
| `scoreDisplay` | `default`, `linear`, `radial`, `temperature`, `donut`, `bullet`, `thermometer`, `pills` or `table` |
| `score` | Name of the question or calculated value that holds the score |
| `min`, `max` | Score range |
| `statusLabels` | Tier labels shared by every display; the range is split into this many tiers |
| `tableRows` | Rows for the `table` display: `metric`, `value` (a variable name or a number), `min`, `max`, `unit` |
| Brand and copy | `logoSrc`, `brandName`, `brandTagline`, `categoryChip`, `title`, `subtitle`, `description`, `noteText`, button labels |

When a survey is completed in the designer's **Preview** tab, the template
is rendered over the preview with the score read from the answers. Saving a
survey without a template shows a one-time reminder.

The template is only rendered inside `FormBuilder` for now: the default
template component reads the creator's theme, so it cannot yet be shown to
respondents outside the designer.

To use your own template component and editor, provide them from an
ancestor of `FormBuilder`:

```ts
import { provideSurveyResultTemplate } from "vue3-survey-builder";
import MyResult from "./MyResult.vue"; // receives the settings as props
import MyResultEditor from "./MyResultEditor.vue"; // v-model:props

provideSurveyResultTemplate({
  id: "my-result",
  component: MyResult,
  editor: MyResultEditor, // optional; defaults to the built-in editor
});
```
