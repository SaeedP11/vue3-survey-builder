<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ json: object }>();
const emit = defineEmits<{ apply: [json: object] }>();

const format = (json: object) => JSON.stringify(json, null, 2);

const draft = ref(format(props.json));
const error = ref("");
const copied = ref(false);

function apply() {
  try {
    const parsed = JSON.parse(draft.value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("The survey JSON must be an object");
    }
    error.value = "";
    emit("apply", parsed);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function revert() {
  draft.value = format(props.json);
  error.value = "";
}

async function copy() {
  try {
    await navigator.clipboard.writeText(draft.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    error.value = "The browser refused clipboard access";
  }
}
</script>

<template>
  <div class="flex h-full flex-col" dir="ltr">
    <div
      class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800"
    >
      <p class="me-auto text-xs text-slate-600 dark:text-slate-400">
        The <code>v-model:json</code> value. Edit it and apply to load it into the
        designer.
      </p>
      <span v-if="error" class="text-xs text-rose-600">{{ error }}</span>
      <button
        type="button"
        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        @click="copy"
      >
        {{ copied ? "Copied" : "Copy" }}
      </button>
      <button
        type="button"
        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        @click="revert"
      >
        Revert
      </button>
      <button
        type="button"
        class="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
        @click="apply"
      >
        Apply
      </button>
    </div>
    <textarea
      v-model="draft"
      aria-label="Survey JSON"
      spellcheck="false"
      class="min-h-0 flex-1 resize-none bg-white p-4 font-mono text-xs outline-none dark:bg-slate-950"
    />
  </div>
</template>
