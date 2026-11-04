<script setup lang="ts">
import { useIconPicker } from "../provider/iconPickerKey.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import IconView from "./templates/IconView.vue";

const props = defineProps<{ modelValue?: string; id?: string; label: string; inputClass?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const { t } = useLocalI18n(surveyResultEditor);
const { picker } = useIconPicker();

const BUILT_IN = ["none", "arrow", "external", "download", "print", "calendar", "phone", "message", "share", "restart"];
</script>

<template>
  <component
    :is="picker"
    v-if="picker"
    :id="id"
    :model-value="modelValue ?? ''"
    :label="label"
    @update:model-value="emit('update:modelValue', ($event as string) || 'none')"
  />
  <div v-else class="relative">
    <select
      :id="id"
      :value="modelValue ?? 'none'"
      :aria-label="label"
      :class="[inputClass, 'w-full ps-9']"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="icon in BUILT_IN" :key="icon" :value="icon">
        {{ t(`actions.icons.${icon}`) }}
      </option>
    </select>
    <span class="pointer-events-none absolute inset-y-0 start-3 flex items-center text-fb-fg-secondary">
      <IconView :name="props.modelValue" />
    </span>
  </div>
</template>
