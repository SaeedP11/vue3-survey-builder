<script setup lang="ts">
import { ref } from "vue";
import type { QuestionFileModel } from "survey-core";
import { Upload, X, Paperclip } from "lucide-vue-next";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionFileModel;
}>();

const emit = defineEmits<{
  submit: [value: unknown];
}>();

const { t } = useLocalI18n(chat);

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<{ name: string; type: string; content: string }[]>([]);

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  Array.from(target.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFiles.value.push({
        name: file.name,
        type: file.type,
        content: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function confirm() {
  emit("submit", selectedFiles.value);
}
</script>

<template>
  <div class="flex flex-col gap-2 pt-2 max-w-sm w-full">
    <div
      class="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500 cursor-pointer transition-colors"
      @click="fileInputRef?.click()"
    >
      <Upload class="w-6 h-6 text-slate-400 mb-1" />
      <span class="text-xs text-slate-600 dark:text-slate-300 font-medium text-center">
        {{ t("chooseFile") }}
      </span>
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        :multiple="question.allowMultiple"
        :accept="question.acceptedTypes"
        @change="onFileChange"
      />
    </div>

    <!-- Selected files preview -->
    <div v-if="selectedFiles.length > 0" class="flex flex-col gap-1.5">
      <div
        v-for="(file, idx) in selectedFiles"
        :key="idx"
        class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-xs"
      >
        <div class="flex items-center gap-1.5 truncate">
          <Paperclip class="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span class="truncate font-medium text-slate-700 dark:text-slate-200">{{ file.name }}</span>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
          @click="removeFile(idx)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        class="mt-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer self-start"
        @click="confirm"
      >
        {{ t("confirm") }}
      </button>
    </div>
  </div>
</template>
