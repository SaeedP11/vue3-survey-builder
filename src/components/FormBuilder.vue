<script setup lang="ts">
import { surveyResultTemplates } from "./templates/surveyResultTemplate.ts";
import { initSurveyCreator } from "../provider/surveyCreator.ts";
import { SurveyCreatorComponent } from "survey-creator-vue";
import TemplateEditor from "./TemplateEditor.vue";
import AiAssistant from "./AiAssistant.vue";
import IconPicker from "./IconPicker.vue";
import "survey-creator-core/i18n/persian";
import "../utils/serilizers";
import { watch } from "vue";

const json = defineModel<object>("json");
const creator = initSurveyCreator();

let skipNextJsonWatch = false;

creator.saveSurveyFunc = () => {
  skipNextJsonWatch = true;
  json.value = creator.JSON;
};

watch(
  json,
  (val) => {
    if (skipNextJsonWatch) {
      skipNextJsonWatch = false;
      return;
    }
    if (val) creator.JSON = val;
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <IconPicker />
  <AiAssistant />
  <TemplateEditor :templates="surveyResultTemplates" />
  <SurveyCreatorComponent :model="creator" />
</template>
