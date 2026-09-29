# 🧱 Form Builder

> A powerful, AI-assisted, drag-and-drop form builder Vue 3 component library — built on top of [SurveyJS](https://surveyjs.io/), with full **Persian (Farsi) / English** bilingual support and **AI-powered form generation**.

[![npm version](https://img.shields.io/npm/v/@yonus_amire01/form-builder?color=2dd4bf&label=npm)](https://www.npmjs.com/package/@yonus_amire01/form-builder)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

- 🎨 **Visual drag-and-drop form designer** powered by SurveyJS Creator
- 🤖 **AI-driven form generation** — describe your form in natural language and let AI build the JSON schema
- 📋 **Standard library panel** — search and insert pre-defined clinical/standard question sets (FHIR `Observation`-compatible)
- 🌗 **Dark & Light themes** out of the box
- 🌐 **Bilingual support** — Persian (Farsi) & English, with RTL rendering
- 🖼️ **Icon Picker** — custom icon selection integrated into the toolbar
- 📦 **Dual build output** — ESM (`.mjs`) + UMD (`.umd.js`) + TypeScript declarations
- ⚡ Built with **Vite 8**, zero-config tree-shakeable exports

---

## 📦 Installation

```bash
# pnpm (recommended)
pnpm add @yonus_amire01/form-builder

# npm
npm install @yonus_amire01/form-builder

# yarn
yarn add @yonus_amire01/form-builder
```

---

## 🎨 Styling

Import the library stylesheet where you use the components:

```ts
import "@yonus_amire01/form-builder/style.css";
```

Some components (the result template, its editor and the toasts) are styled
with Tailwind v4 utilities, which your app's Tailwind build generates. Add
the library's Tailwind entry to your app's CSS, after Tailwind itself:

```css
@import "tailwindcss";
@import "@yonus_amire01/form-builder/tailwind.css";
```

It names the library's sources for Tailwind to scan (Tailwind skips
`node_modules` otherwise) and registers the `fb-*` colours those components
use.

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
} from "@yonus_amire01/form-builder";

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
} from "@yonus_amire01/form-builder";

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

- The popup component (`advanced-text-input-popup`) is registered
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
import { registerCustomLogic } from "@yonus_amire01/form-builder";

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

## 🪟 HTML-property Template Gallery (creator property grid)

`registerHtmlEditorModal` adds a button to the title of every property
editor in the Survey Creator's property grid whose underlying property
stores HTML — i.e. `html`, `completedHtml`, `completedBeforeHtml`,
`loadingHtml`, and any custom `:html`-typed property. Clicking the
button opens a full template gallery: a categorised grid of view
components you've registered, with a detail preview and a single
"Insert template" button that writes the chosen component's HTML
output into the property.

### 1. Register views

Each view is a Vue component that renders a preview AND exposes a
`getHtml()` method through `defineExpose`. The library calls
`getHtml()` when the user clicks **Insert template** in the detail
preview, and writes the returned string straight into the property.

```ts
import { registerHtmlEditorModal } from "@yonus_amire01/form-builder";
import BarChart from "./components/BarChart.vue";
import PieChart from "./components/PieChart.vue";

registerHtmlEditorModal({
  iconName: "icon-edit",       // optional — title-action icon
  title: "Choose template",    // optional — title-action tooltip
  views: [
    {
      id: "bar",
      name: "Vertical Bar",
      category: "Bar",
      description: "Compare values across discrete categories.",
      bestFor: "Comparing categories",
      dataShape: "1 dim · 1 measure",
      component: BarChart,
    },
    {
      id: "pie",
      name: "Pie",
      category: "Pie",
      description: "Show parts of a whole as proportional slices.",
      bestFor: "Part-to-whole",
      component: PieChart,
    },
  ],
});
```

### 2. Author a view component

```vue
<!-- BarChart.vue -->
<script setup lang="ts">
import { ref } from "vue";

const svgRef = ref<SVGSVGElement | null>(null);

defineExpose({
  getHtml(): string {
    return svgRef.value?.outerHTML ?? "";
  },
});
</script>

<template>
  <svg ref="svgRef" viewBox="0 0 120 80" width="100%" height="100%">
    <!-- … your chart markup … -->
  </svg>
</template>
```

`getHtml` can return a string **or a `Promise<string>`** — fetch
data, hydrate a third-party renderer, or build markup with a template
literal, then return the final HTML.

### View shape

| Field         | Type                          | Notes                                                                                  |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `id`          | `string`                      | Stable identifier (used for keys + selection state)                                    |
| `name`        | `string`                      | Card title                                                                             |
| `category`    | `string?`                     | If any view has one, category filter chips appear ("All", plus each distinct category) |
| `description` | `string?`                     | Shown under the card title and inside the detail modal                                 |
| `bestFor`     | `string?`                     | Optional row in the detail modal's meta panel                                          |
| `dataShape`   | `string?`                     | Optional row in the detail modal's meta panel (rendered in JetBrains Mono)             |
| `component`   | `Component`                   | Vue component; **must `defineExpose({ getHtml() })`**                                  |
| `props`       | `Record<string, unknown>?`    | Bound to the component instance in both card and detail previews                       |

### How it works

- A title action with id `fb-html-editor` is pushed onto every property
  editor whose `property.type === "html"`. Title actions render on the
  trailing edge of the label (right in LTR, left in RTL).
- The hook subscribes inside `initSurveyCreator()`, so every creator
  produced by `FormBuilder` picks it up automatically.
- Open state, current value, and the active property editor live in a
  shared reactive store (`src/utils/htmlEditorModal.ts`). Clicking the
  title button records `editor.value` and opens the gallery.
- The gallery renders a card for each view, filterable by category.
  Selecting a card opens a detail preview; the **Insert template**
  button calls the previewed component's `getHtml()` and writes the
  result back into `editor.value` (which SurveyJS propagates to the
  surveyElement).
- Visual design comes from Claude Design — Plus Jakarta Sans +
  JetBrains Mono, `oklch()` palette, soft accent ring on hover, scaled
  pop-in animation.
- The gallery itself is styled with plain scoped CSS + CSS custom
  properties — **no Tailwind dependency in the published library**.
  Consumers only need to import `@yonus_amire01/form-builder/style.css`
  for everything to render.
- Dark / light mode follows the creator's color mode automatically.
  The gallery reads `useSurveyConfig().colorMode` and toggles a
  `.fb-dark` class that flips all theme tokens (`--fb-*` CSS
  variables) — no separate configuration needed.
- **Demo-only:** the example chart/score widgets in `src/demo/*` use
  Tailwind v4 (`@tailwindcss/vite`) for convenience, and Tailwind is
  imported from `src/main.ts` (the dev/demo entry) rather than the
  library entry. If you author your own view components, you can use
  whatever styling you want — they're rendered inside the gallery via
  `<component :is>` and don't inherit any styling assumptions.
