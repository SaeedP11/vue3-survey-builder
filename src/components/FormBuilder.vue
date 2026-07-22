<script setup lang="ts">
import SurveyResultEditorModal from "./SurveyResultEditorModal.vue";
import SurveyResultRequiredToast from "./SurveyResultRequiredToast.vue";
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
const showRequiredToast = ref(false);

let skipNextJsonWatch = false;

function hasResultTemplate(surveyJson: any): boolean {
  const rt = surveyJson?.resultTemplate;
  return !!rt && typeof rt === "object" && Object.keys(rt).length > 0;
}

creator.saveSurveyFunc = () => {
  const current = creator.JSON;
  if (!hasResultTemplate(current)) {
    showRequiredToast.value = true;
  } else {
    showRequiredToast.value = false;
  }
  skipNextJsonWatch = true;
  json.value = current;
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
  <SurveyResultRequiredToast
    :open="showRequiredToast"
    @close="showRequiredToast = false"
  />
  <SurveyCreatorComponent :model="creator" />
  <!-- `.svd-simulator-content .sd-root-modern .sv-scroll__wrapper` The place where the preview is displayed -->
  <Teleport
    v-if="showResult"
    to=".svd-simulator-content .sd-root-modern .sv-scroll__wrapper"
  >
    <RenderResult :templateProps="creator.JSON?.resultTemplate" :result />
  </Teleport>
</template>
