<script setup lang="ts">
import { ref } from "vue";
import type { QuestionSignaturePadModel } from "survey-core";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionSignaturePadModel;
}>();

const emit = defineEmits<{
  submit: [value: string];
}>();

const { t } = useLocalI18n(chat);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const hasDrawn = ref(false);

function startDrawing(e: MouseEvent | TouchEvent) {
  isDrawing.value = true;
  hasDrawn.value = true;
  draw(e);
}

function stopDrawing() {
  isDrawing.value = false;
  const ctx = canvasRef.value?.getContext("2d");
  ctx?.beginPath();
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#0284c7";

  ctx.lineTo(clientX - rect.left, clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(clientX - rect.left, clientY - rect.top);
}

function clear() {
  const ctx = canvasRef.value?.getContext("2d");
  if (canvasRef.value && ctx) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    hasDrawn.value = false;
  }
}

function confirm() {
  if (canvasRef.value && hasDrawn.value) {
    emit("submit", canvasRef.value.toDataURL());
  }
}
</script>

<template>
  <div class="flex flex-col gap-2 pt-2 max-w-xs w-full">
    <div class="relative border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <canvas
        ref="canvasRef"
        width="280"
        height="120"
        class="w-full touch-none cursor-crosshair block"
        @mousedown="startDrawing"
        @mouseup="stopDrawing"
        @mousemove="draw"
        @touchstart.passive="startDrawing"
        @touchend.passive="stopDrawing"
        @touchmove.passive="draw"
      />
      <div v-if="!hasDrawn" class="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-600 text-xs">
        {{ t("signHere") }}
      </div>
    </div>

    <div class="flex items-center justify-between">
      <button
        type="button"
        class="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
        @click="clear"
      >
        {{ t("clear") }}
      </button>
      <button
        type="button"
        :disabled="!hasDrawn"
        class="px-3.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white shadow-xs transition-all cursor-pointer"
        @click="confirm"
      >
        {{ t("confirm") }}
      </button>
    </div>
  </div>
</template>
