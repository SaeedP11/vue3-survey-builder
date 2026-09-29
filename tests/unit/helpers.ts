import { mount } from "@vue/test-utils";
import { SurveyCreatorModel } from "survey-creator-core";
import { defineComponent, h, type Component } from "vue";
import { createI18n } from "vue-i18n";
import { initSurveyCreator } from "../../src/provider/surveyCreator.ts";

export function createTestI18n(locale = "en") {
  return createI18n({ legacy: false, locale, messages: {} });
}

export function newCreator(json?: object) {
  const creator = new SurveyCreatorModel({});
  if (json) creator.JSON = json;
  return creator;
}

interface MountOptions {
  creator?: SurveyCreatorModel;
  props?: object;
  locale?: string;
  /** Runs in the host's setup, before the component: for provide* calls. */
  setup?: () => void;
  stubs?: Record<string, Component | boolean>;
}

/**
 * Mounts `component` under a host that provides a SurveyCreatorModel, as
 * FormBuilder does for its children, and installs vue-i18n.
 */
export function mountWithCreator(
  component: Component,
  { creator = newCreator(), props = {}, locale = "en", setup, stubs }: MountOptions = {},
) {
  const i18n = createTestI18n(locale);
  const Host = defineComponent({
    setup() {
      initSurveyCreator(creator);
      setup?.();
      return () => h(component, props);
    },
  });
  const wrapper = mount(Host, {
    global: { plugins: [i18n], stubs },
    attachTo: document.body,
  });
  return { wrapper, creator, i18n, child: wrapper.findComponent(component) };
}

/** Lets pending promises and Vue's scheduler run. */
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
