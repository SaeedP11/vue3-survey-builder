<script setup lang="ts">
import { computed } from "vue";
import PersianDateTimePicker from "./PersianDateTimePicker.vue";
import { getOriginalTextInputComponent } from "../utils/registerPersianDatePicker";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  question?: any;
  getRef?: (el: any) => void;
}>();

const isDateTime = computed(() => {
  const type = props.question?.inputType;
  return (
    type === "date" ||
    type === "datetime-local" ||
    type === "datetime" ||
    type === "time"
  );
});

const originalComponent = getOriginalTextInputComponent();
</script>

<template>
  <PersianDateTimePicker
    v-if="isDateTime"
    :question="question"
    :get-ref="getRef"
  />
  <component
    :is="originalComponent"
    v-else-if="originalComponent"
    :question="question"
    :get-ref="getRef"
  />
</template>
