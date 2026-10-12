<script setup lang="ts">
import { computed, ref, useId } from "vue";
import type { Question } from "survey-core";
import { useSurveyCreator } from "../provider/surveyCreator";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { safeImageSrc } from "../utils/resultContent.ts";

/** Without a host upload handler a file is saved in the form JSON, so it is kept small. */
const MAX_EMBEDDED_BYTES = 1024 * 1024;

const model = defineModel<string>({ default: "" });
const props = defineProps<{ label: string }>();

const { t } = useLocalI18n(surveyResultEditor);
const creator = useSurveyCreator();
const id = useId();
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const error = ref("");

const preview = computed(() => safeImageSrc(model.value));
const embedded = computed(() => model.value.startsWith("data:"));
// A data URL is no use to read or edit; the field stays empty for a new address
const urlText = computed(() => (embedded.value ? "" : model.value));
const badUrl = computed(
  () => !!model.value.trim() && !embedded.value && !preview.value,
);

function onUrlInput(value: string) {
  error.value = "";
  model.value = value.trim();
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  error.value = "";
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    error.value = t("imageField.notImage");
    return;
  }
  if (creator.onUploadFile.isEmpty && file.size > MAX_EMBEDDED_BYTES) {
    error.value = t("imageField.tooLarge", { max: "1 MB" });
    return;
  }
  uploading.value = true;
  // The host's onUploadFile handler stores it and returns its URL; without one,
  // SurveyJS reads it as a data URL
  creator.uploadFiles(
    [file],
    undefined as unknown as Question,
    (status: string, data: unknown) => {
      uploading.value = false;
      const url = Array.isArray(data) ? data[0]?.content ?? data[0] : data;
      if (status === "success" && typeof url === "string" && url) {
        model.value = url;
      } else {
        error.value = t("imageField.failed");
      }
    },
    {
      element: creator.survey,
      elementType: "resultImage",
      propertyName: "resultTemplate",
    },
  );
}
</script>

<template>
  <div class="flex items-start gap-3">
    <div
      class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-fb-border bg-fb-surface-muted text-fb-fg-muted"
    >
      <img
        v-if="preview"
        :src="preview"
        alt=""
        class="h-full w-full object-cover"
      />
      <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6zm0 10l4.5-4.5L13 16m-1-1l2.5-2.5L20 18M15.5 9.5h.01"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <label :for="id" class="text-[12px] font-semibold text-fb-fg-secondary">{{
        props.label
      }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-fb-border bg-fb-surface-muted px-3 py-1.5 text-xs font-semibold text-fb-fg hover:bg-fb-border disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent"
          :disabled="uploading"
          @click="fileInput?.click()"
        >
          {{
            uploading
              ? t("imageField.uploading")
              : model
                ? t("imageField.replace")
                : t("imageField.upload")
          }}
        </button>
        <button
          v-if="model"
          type="button"
          class="cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-3 py-1.5 text-xs font-semibold text-fb-fg-muted hover:bg-fb-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fb-accent"
          @click="onUrlInput('')"
        >
          {{ t("imageField.clear") }}
        </button>
      </div>
      <input
        :id="id"
        :value="urlText"
        type="url"
        inputmode="url"
        dir="ltr"
        placeholder="https://"
        :aria-invalid="badUrl || undefined"
        class="rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent aria-invalid:border-[#d92d20]"
        @input="onUrlInput(($event.target as HTMLInputElement).value)"
      />
      <p v-if="embedded && !error" class="text-[11px] leading-snug text-fb-fg-muted">
        {{ t("imageField.embedded") }}
      </p>
      <p
        v-if="error || badUrl"
        role="alert"
        class="text-xs leading-snug text-[#d92d20]"
      >
        {{ error || t("imageField.badUrl") }}
      </p>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        class="hidden"
        tabindex="-1"
        aria-hidden="true"
        @change="onFile"
      />
    </div>
  </div>
</template>
