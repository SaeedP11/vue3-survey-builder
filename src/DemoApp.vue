<script setup lang="ts">
import { provideSurveyConfig } from "./provider/surveyConfig";
import FormBuilder from "./components/FormBuilder.vue";
import { ThemeModes, Locales } from "./types/index.ts";
import { ref } from "vue";

provideSurveyConfig({
  colorMode: ref(ThemeModes.dark),
  locale: ref(Locales.fa),
});

const json = ref<object>({});
</script>

<template>
  <FormBuilder v-model:json="json" />
</template>
