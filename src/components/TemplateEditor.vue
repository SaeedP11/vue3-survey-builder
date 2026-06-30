<script setup lang="ts">
import { computed, ref, watch } from "vue";
import useCreatorToolbarAction from "../composables/useCreatorToolbarAction";
import { useSurveyCreator } from "../provider/surveyCreator";
import { useSurveyConfig } from "../provider/surveyConfig";

type FieldType = "text" | "textarea" | "number" | "select" | "checkbox";

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  group?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  dependsOn?: string | string[] | Record<string, unknown>;
}

export interface PropsSchema {
  fields: SchemaField[];
}

const props = defineProps<{
  templates: any[];
}>();

const emit = defineEmits<{
  apply: [html: string];
  close: [];
}>();

const cat = ref<string>("All");
const openId = ref<string | null>(null);
const creator = useSurveyCreator();
const config = useSurveyConfig();
const isOpen = ref(false);

const themeVars = computed<Record<string, string>>(() => {
  const v = config.cssVariable ?? {};
  const isDark = (config.colorMode as { value: string }).value === "dark";

  const out: Record<string, string> = {};

  if (v.primaryColor) out["--color-fb-accent"] = v.primaryColor;
  if (v.fontFamily) out.fontFamily = v.fontFamily;

  if (isDark) {
    if (v.DarkPrimaryBackground)
      out["--color-fb-shell"] = v.DarkPrimaryBackground;
    if (v.DarkSsecondaryBackground) {
      out["--color-fb-surface"] = v.DarkSsecondaryBackground;
      out["--color-fb-surface-muted"] = v.DarkSsecondaryBackground;
    }
    out["--color-fb-fg"] = "oklch(0.95 0.01 265)";
    out["--color-fb-fg-secondary"] = "oklch(0.78 0.01 265)";
    out["--color-fb-fg-muted"] = "oklch(0.6 0.01 265)";
    out["--color-fb-border"] = "oklch(0.32 0.005 265)";
    out["--color-fb-border-strong"] = "oklch(0.42 0.01 265)";
    out["--color-fb-overlay"] = "oklch(0.1 0.02 265 / 0.55)";
  }

  return out;
});

function close() {
  isOpen.value = false;
  openId.value = null;
  emit("close");
}

const categories = computed(() => {
  const set = new Set<string>(["All"]);
  for (const v of props.templates) if (v.category) set.add(v.category);
  return [...set];
});

const filtered = computed(() => {
  if (cat.value === "All") return props.templates;
  return props.templates.filter((v) => v.category === cat.value);
});

const openView = computed(() =>
  openId.value
    ? (props.templates.find((v) => v.id === openId.value) ?? null)
    : null,
);

const editedProps = ref<Record<string, any>>({});
const previewWrap = ref<HTMLElement | null>(null);
const detailRef = ref<{ getHtml?: () => string | Promise<string> } | null>(
  null,
);

watch(openView, (v) => {
  editedProps.value = v?.props ? structuredClone(v.props) : {};
});

function fieldVisible(field: SchemaField, state: Record<string, any>): boolean {
  const dep = field.dependsOn;
  if (!dep) return true;
  if (typeof dep === "string") return !!state[dep];
  if (Array.isArray(dep)) return dep.every((k) => !!state[k]);
  return Object.entries(dep).every(([k, v]) => state[k] === v);
}

const groupedFields = computed<{ name: string; fields: SchemaField[] }[]>(
  () => {
    const schema: PropsSchema | undefined = openView.value?.propsSchema;
    if (!schema) return [];
    const groups = new Map<string, SchemaField[]>();
    for (const f of schema.fields) {
      if (!fieldVisible(f, editedProps.value)) continue;
      const g = f.group ?? "Properties";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    return [...groups.entries()].map(([name, fields]) => ({ name, fields }));
  },
);

function getPath(obj: any, key: string): unknown {
  const parts = key.split(/[\[\].]+/).filter(Boolean);
  return parts.reduce<unknown>(
    (acc, p) => (acc == null ? undefined : (acc as any)[p]),
    obj,
  );
}

function setPath(obj: any, key: string, val: unknown): void {
  const parts = key.split(/[\[\].]+/).filter(Boolean);
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const nextP = parts[i + 1];
    if (cur[p] == null) cur[p] = /^\d+$/.test(nextP) ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = val;
}

function updateField(field: SchemaField, raw: unknown) {
  const val = field.type === "number" ? Number(raw) : raw;
  setPath(editedProps.value, field.key, val);
}

async function insertOpen() {
  const v = openView.value;
  if (!v) return;
  let html: string;
  if (detailRef.value && typeof detailRef.value.getHtml === "function") {
    html = String((await Promise.resolve(detailRef.value.getHtml())) ?? "");
  } else if (previewWrap.value) {
    const child = previewWrap.value.firstElementChild as HTMLElement | null;
    html = child?.outerHTML ?? "";
  } else {
    html = "";
  }
  emit("apply", html);
}

useCreatorToolbarAction(creator, {
  id: "ui",
  iconName: "pg-specific-24x24",
  action: () => {
    isOpen.value = !isOpen.value;
  },
});
</script>

<template>
  <div
    class="fixed inset-0 z-9998 flex items-center justify-center p-8 box-border bg-fb-overlay backdrop-blur-sm text-fb-fg font-['Plus_Jakarta_Sans',system-ui,sans-serif] antialiased"
    :style="themeVars"
    style="animation: fb-fade 0.15s ease"
    v-if="isOpen"
  >
    <div
      class="flex h-full w-full max-w-295 flex-col overflow-hidden rounded-2xl bg-fb-shell shadow-2xl"
      style="animation: fb-pop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
      @click.stop
    >
      <header
        class="sticky top-0 z-10 flex h-15 items-center gap-4.5 border-b border-fb-border bg-fb-surface/80 px-6 backdrop-blur"
      >
        <div
          class="flex items-center gap-2.5 text-[15px] font-bold tracking-tight"
        >
          <span
            class="grid h-6.5 w-6.5 place-items-center rounded-md text-[13px] text-fb-accent-on bg-fb-accent"
            >◳</span
          >
          FormKit
        </div>
        <div class="flex items-center gap-2.5 text-[13px] text-fb-fg-secondary">
          <span>HTML property</span>
          <span class="opacity-45">/</span>
          <span class="font-semibold text-fb-fg">Choose template</span>
        </div>
        <div class="flex-1" />
        <button
          class="h-7.5 w-7.5 cursor-pointer rounded-lg border-0 bg-fb-surface-muted text-base leading-none text-fb-fg-muted hover:bg-fb-border"
          aria-label="Close"
          @click="close"
        >
          ✕
        </button>
      </header>

      <div class="flex-1 overflow-auto px-7 pt-9 pb-14">
        <div
          class="font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-widest text-fb-fg-muted"
        >
          Template library
        </div>
        <h1 class="mt-2.5 text-[30px] font-bold tracking-tight text-fb-fg">
          Choose a template
        </h1>
        <p
          class="mt-2 max-w-xl text-[15px] leading-relaxed text-fb-fg-muted text-pretty"
        >
          Pick a template to insert as HTML. Preview any template full-size,
          then insert it into the property.
        </p>

        <div v-if="categories.length > 1" class="mt-6 flex flex-wrap gap-2">
          <button
            v-for="c in categories"
            :key="c"
            class="cursor-pointer appearance-none rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-all"
            :class="
              cat === c
                ? 'bg-fb-accent-soft text-fb-accent border-fb-accent'
                : 'bg-fb-surface text-fb-fg-secondary border-fb-border hover:border-fb-border-strong'
            "
            @click="cat = c"
          >
            {{ c }}
          </button>
        </div>

        <div
          class="mt-5 grid gap-4.5"
          style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))"
        >
          <button
            v-for="t in filtered"
            :key="t.id"
            class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-fb-border bg-fb-surface p-0 text-left text-fb-fg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl hover:border-fb-border-strong"
            @click="openId = t.id"
          >
            <div
              class="flex h-37.5 items-center justify-center overflow-hidden border-b border-fb-border bg-fb-surface-muted box-border"
            >
              <img
                v-if="t.thumbnail"
                :src="t.thumbnail"
                :alt="t.name"
                class="block h-full w-full object-cover"
                loading="lazy"
              />
              <component
                :is="t.component"
                v-else
                v-bind="t.props || {}"
                class="block h-full w-full"
              />
            </div>
            <div class="flex items-center justify-between gap-2 px-3.5 py-3">
              <div class="min-w-0">
                <div class="text-[14.5px] font-semibold tracking-tight">
                  {{ t.name }}
                </div>
                <div
                  v-if="t.description"
                  class="mt-0.5 text-xs leading-snug text-fb-fg-muted"
                >
                  {{ t.description }}
                </div>
              </div>
              <span
                v-if="t.category"
                class="shrink-0 rounded-md bg-fb-surface-muted px-2 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
                >{{ t.category }}</span
              >
            </div>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="openView"
      class="fixed inset-0 z-20 flex items-center justify-center p-8 box-border bg-fb-overlay backdrop-blur-sm"
      style="animation: fb-fade 0.15s ease"
      @click.self="openId = null"
    >
      <div
        v-if="openView.propsSchema"
        class="relative grid h-full w-full max-w-7xl overflow-hidden rounded-2xl bg-fb-surface shadow-2xl"
        style="
          grid-template-columns: 1fr 420px;
          animation: fb-pop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        "
      >
        <div
          ref="previewWrap"
          class="overflow-auto bg-fb-surface-muted border-r border-fb-border"
        >
          <component
            :is="openView.component"
            v-bind="editedProps"
            ref="detailRef"
          />
        </div>

        <div class="relative flex flex-col bg-fb-surface min-h-0">
          <div
            class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-fb-border bg-fb-surface px-6 py-5"
          >
            <div class="min-w-0 flex-1">
              <div
                v-if="openView.category"
                class="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] uppercase tracking-wider text-fb-fg-muted"
              >
                {{ openView.category }} template
              </div>
              <h2
                class="m-0 mt-1.5 text-[20px] font-bold tracking-tight text-fb-fg truncate"
              >
                {{ openView.name }}
              </h2>
              <p
                v-if="openView.description"
                class="mt-1 text-[12.5px] leading-snug text-fb-fg-muted text-pretty"
              >
                {{ openView.description }}
              </p>
            </div>
            <button
              class="h-7.5 w-7.5 shrink-0 cursor-pointer rounded-lg border-0 bg-fb-surface-muted text-base leading-none text-fb-fg-muted hover:bg-fb-border"
              aria-label="Close"
              @click="openId = null"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-auto px-6 py-5 space-y-6">
            <section v-for="group in groupedFields" :key="group.name">
              <h3
                class="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-wider text-fb-fg-muted"
              >
                {{ group.name }}
              </h3>
              <div class="mt-3 space-y-3.5">
                <div
                  v-for="field in group.fields"
                  :key="field.key"
                  class="flex flex-col gap-1.5"
                >
                  <label
                    class="text-[12px] font-semibold text-fb-fg-secondary"
                    >{{ field.label }}</label
                  >

                  <input
                    v-if="field.type === 'text'"
                    :value="getPath(editedProps, field.key) ?? ''"
                    :placeholder="field.placeholder"
                    type="text"
                    class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                    @input="
                      updateField(
                        field,
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                  />

                  <textarea
                    v-else-if="field.type === 'textarea'"
                    :value="(getPath(editedProps, field.key) ?? '') as string"
                    :placeholder="field.placeholder"
                    rows="3"
                    class="resize-y rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm leading-relaxed text-fb-fg outline-none focus:border-fb-accent"
                    @input="
                      updateField(
                        field,
                        ($event.target as HTMLTextAreaElement).value,
                      )
                    "
                  />

                  <input
                    v-else-if="field.type === 'number'"
                    :value="getPath(editedProps, field.key) ?? ''"
                    :placeholder="field.placeholder"
                    :min="field.min"
                    :max="field.max"
                    :step="field.step ?? 1"
                    type="number"
                    class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                    @input="
                      updateField(
                        field,
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                  />

                  <select
                    v-else-if="field.type === 'select'"
                    :value="(getPath(editedProps, field.key) ?? '') as string"
                    class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent"
                    @change="
                      updateField(
                        field,
                        ($event.target as HTMLSelectElement).value,
                      )
                    "
                  >
                    <option
                      v-for="o in field.options"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </option>
                  </select>

                  <label
                    v-else-if="field.type === 'checkbox'"
                    class="flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      :checked="!!getPath(editedProps, field.key)"
                      type="checkbox"
                      class="h-4 w-4 cursor-pointer rounded border-fb-border accent-fb-accent"
                      @change="
                        updateField(
                          field,
                          ($event.target as HTMLInputElement).checked,
                        )
                      "
                    />
                    <span class="text-sm text-fb-fg">{{
                      field.placeholder ?? "Enabled"
                    }}</span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          <div
            class="sticky bottom-0 z-10 flex gap-2.5 border-t border-fb-border bg-fb-surface px-6 py-4"
          >
            <button
              class="shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-4 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
              @click="openId = null"
            >
              Cancel
            </button>
            <button
              class="flex-1 cursor-pointer rounded-lg border-0 px-4 py-2.5 text-sm font-semibold text-fb-accent-on bg-fb-accent transition-[filter] hover:brightness-90"
              @click="insertOpen"
            >
              Insert template
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="relative grid max-h-full w-full max-w-220 overflow-auto rounded-2xl bg-fb-surface shadow-2xl md:grid-cols-[1.45fr_1fr]"
        style="animation: fb-pop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
      >
        <div
          class="flex flex-col border-b border-fb-border bg-fb-surface-muted p-7 md:border-b-0 md:border-r"
        >
          <div
            v-if="openView.category"
            class="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] uppercase tracking-wider text-fb-fg-muted"
          >
            {{ openView.category }} template
          </div>
          <div
            class="mt-3.5 flex flex-1 items-center justify-center min-h-75"
          >
            <component
              :is="openView.component"
              v-bind="openView.props || {}"
              ref="detailRef"
              class="block h-80 w-full"
            />
          </div>
        </div>
        <div class="relative flex flex-col p-7">
          <button
            class="absolute top-4.5 right-4.5 h-7.5 w-7.5 cursor-pointer rounded-lg border-0 bg-fb-surface-muted text-base leading-none text-fb-fg-muted hover:bg-fb-border"
            aria-label="Close"
            @click="openId = null"
          >
            ✕
          </button>
          <h2 class="m-0 pr-10 text-[23px] font-bold tracking-tight text-fb-fg">
            {{ openView.name }}
          </h2>
          <p
            v-if="openView.description"
            class="mt-2.5 text-sm leading-relaxed text-fb-fg-muted text-pretty"
          >
            {{ openView.description }}
          </p>
          <div
            v-if="openView.bestFor || openView.dataShape"
            class="mt-5 flex flex-col overflow-hidden rounded-xl border border-fb-border"
          >
            <div
              v-if="openView.bestFor"
              class="flex justify-between gap-3 bg-fb-surface-muted px-3.5 py-2.5 text-[12.5px] text-fb-fg-muted"
            >
              <span>Best for</span>
              <span class="text-right font-semibold text-fb-fg">{{
                openView.bestFor
              }}</span>
            </div>
            <div
              v-if="openView.dataShape"
              class="flex justify-between gap-3 border-t border-fb-border bg-fb-surface-muted px-3.5 py-2.5 text-[12.5px] text-fb-fg-muted"
            >
              <span>Data shape</span>
              <span
                class="text-right font-semibold text-fb-fg font-['JetBrains_Mono',ui-monospace,monospace]"
                >{{ openView.dataShape }}</span
              >
            </div>
          </div>
          <div class="flex-1" />
          <div class="mt-4.5 flex gap-2.5">
            <button
              class="shrink-0 cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-4 py-2.5 text-sm font-semibold text-fb-fg hover:bg-fb-surface-muted"
              @click="openId = null"
            >
              Cancel
            </button>
            <button
              class="flex-1 cursor-pointer rounded-lg border-0 px-4 py-2.5 text-sm font-semibold text-fb-accent-on bg-fb-accent transition-[filter] hover:brightness-90"
              @click="insertOpen"
            >
              Insert template
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fb-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fb-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
