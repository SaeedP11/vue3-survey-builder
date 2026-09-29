<script setup lang="ts">
import { ref } from "vue";
import { SurveyComponent, useSurveyModel } from "../../src/index.ts";
import { logEvent } from "./eventLog.ts";

// Built once from the JSON it mounts with; the parent remounts it (key) to
// start over.
const props = defineProps<{ json: object }>();
const emit = defineEmits<{ restart: [] }>();

const survey = useSurveyModel(props.json);
const result = ref<Record<string, unknown> | null>(null);

survey.onComplete.add((sender) => {
  result.value = sender.data;
  logEvent("complete", "survey completed", sender.data);
});
</script>

<template>
  <div class="h-full overflow-auto">
    <p
      class="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      dir="ltr"
    >
      The survey as a respondent sees it, through <code>useSurveyModel</code> and
      <code>SurveyComponent</code>. The result template only renders inside the
      designer (its Preview tab), so here you get the submitted data.
    </p>
    <SurveyComponent :model="survey" />
    <section v-if="result" class="mx-auto max-w-3xl p-4" dir="ltr">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Submitted data</h2>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          @click="emit('restart')"
        >
          Fill again
        </button>
      </div>
      <pre
        class="mt-2 overflow-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-900"
        >{{ JSON.stringify(result, null, 2) }}</pre
      >
    </section>
  </div>
</template>
