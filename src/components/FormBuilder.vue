<script setup lang="ts">
import SurveyResultEditorModal from "./SurveyResultEditorModal.vue";
import { initSurveyCreator } from "../provider/surveyCreator.ts";
import { SurveyCreatorComponent } from "survey-creator-vue";
import handleComplete from "../utils/handleComplete.ts";
import RenderResult from "./RenderResult.vue";
import AiAssistant from "./AiAssistant.vue";
import IconPicker from "./IconPicker.vue";
import "survey-creator-core/i18n/persian";
import { ref, watch } from "vue";
import "../utils/serilizers";

const json = defineModel<object>("json");
const creator = initSurveyCreator();
const showResult = ref(false);
const result = ref({});

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

handleComplete(creator, (sender) => {
  sender.showCompletedPage = false;
  sender.showCompletePage = false;
  result.value = sender.data;
  showResult.value = true;
});
</script>

<template>
  <IconPicker />
  <AiAssistant />
  <SurveyResultEditorModal />
  <SurveyCreatorComponent :model="creator" />
  <!-- `.svd-simulator-content .sd-root-modern .sv-scroll__wrapper` The place where the preview is displayed -->
  <Teleport
    v-if="showResult"
    to=".svd-simulator-content .sd-root-modern .sv-scroll__wrapper"
  >
    <RenderResult :templateProps="creator.JSON?.resultTemplate" :result />
  </Teleport>
</template>
