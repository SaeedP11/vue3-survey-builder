<script setup lang="ts">
import SurveyResultEditorModal from "./SurveyResultEditorModal.vue";
import SurveyResultRequiredToast from "./SurveyResultRequiredToast.vue";
import { initSurveyCreator } from "../provider/surveyCreator.ts";
import { SurveyCreatorComponent } from "survey-creator-vue";
import type { SurveyModel } from "survey-core";
import handleComplete from "../utils/handleComplete.ts";
import registerJsonEditor from "../utils/registerJsonEditor.ts";
import useJsonFormatAction from "../composables/useJsonFormatAction.ts";
import RenderResult from "./RenderResult.vue";
import AiAssistant from "./AiAssistant.vue";
import IconPicker from "./IconPicker.vue";
import "survey-creator-core/i18n/persian";
// The designer's strings above; these are the Preview tab survey's own
import "survey-core/i18n/persian";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import localeDirection, {
  type TextDirection,
} from "../utils/localeDirection.ts";
import immediateWatch from "../utils/immediateWatch.ts";
import "../utils/serilizers";

const props = defineProps<{
  /** The designer's text direction; by default the direction of vue-i18n's locale. */
  dir?: TextDirection;
  /** External variables (e.g. `{ role: 'doctor' }`) to evaluate conditions against in preview. */
  variables?: Record<string, unknown>;
}>();
const json = defineModel<object>("json");
registerJsonEditor();
const creator = initSurveyCreator();
const { locale } = useI18n();
const direction = computed(() => props.dir ?? localeDirection(locale.value));
immediateWatch([direction], () => (creator.isRTL = direction.value === "rtl"));
useJsonFormatAction(creator);
const showResult = ref(false);
const result = ref({});
const showRequiredToast = ref(false);

let skipNextJsonWatch = false;
// Autosave runs on every edit: remind about the result template once, not
// on each save.
let requiredToastShown = false;

function hasResultTemplate(surveyJson: any): boolean {
  const rt = surveyJson?.resultTemplate;
  return !!rt && typeof rt === "object" && Object.keys(rt).length > 0;
}

creator.saveSurveyFunc = () => {
  const current = creator.JSON;
  if (hasResultTemplate(current)) {
    showRequiredToast.value = false;
  } else if (!requiredToastShown) {
    requiredToastShown = true;
    showRequiredToast.value = true;
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

let completedSurvey: SurveyModel | undefined;
// Each edit rebuilds the Preview tab's survey and its DOM: a result page left open
// would teleport into the old, removed container and the new test would not render.
creator.onSurveyInstanceCreated.add((_sender, options) => {
  showResult.value = false;
  completedSurvey = undefined;
  if (props.variables && options?.survey) {
    for (const [k, v] of Object.entries(props.variables)) {
      options.survey.setVariable(k, v);
    }
  }
});
handleComplete(creator, (sender) => {
  sender.showCompletedPage = false;
  sender.showCompletePage = false;
  completedSurvey = sender;
  result.value = sender.data;
  showResult.value = true;
});

// The Preview tab's result page: restart runs the survey again from its first page
function restartPreview() {
  showResult.value = false;
  completedSurvey?.clear(true, true);
}
</script>

<template>
  <!-- SurveyJS mirrors the creator with `:dir(rtl)`, so the direction is set on an element around
       it; `display: contents` keeps that element out of the host's layout. -->
  <div class="fb-root" :dir="direction" style="display: contents">
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
      <RenderResult
        :templateProps="creator.JSON?.resultTemplate"
        :result
        :survey="completedSurvey"
        :variables="props.variables"
        @restart="restartPreview"
        @close="showResult = false"
      />
    </Teleport>
  </div>
</template>
