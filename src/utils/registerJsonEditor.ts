import JsonEditorTab from "../components/JsonEditorTab.vue";
import { ComponentFactory } from "survey-vue3-ui";
import { SvgRegistry } from "survey-core";

// Indented lines: the Format JSON toolbar button
const FORMAT_ICON =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
  '<rect x="3" y="4" width="10" height="2" rx="1"/>' +
  '<rect x="7" y="9" width="14" height="2" rx="1"/>' +
  '<rect x="7" y="14" width="10" height="2" rx="1"/>' +
  '<rect x="3" y="19" width="12" height="2" rx="1"/></svg>';

/**
 * Puts the highlighted JSON editor in place of the creator's textarea JSON
 * tab. Runs on each FormBuilder setup, after any `surveyCreatorPlugin`
 * install that would register the stock one again. The creator only uses
 * the textarea tab while Ace is absent (`window.ace`); with Ace, its editor
 * stays.
 */
export default function registerJsonEditor(): void {
  ComponentFactory.Instance.registerComponent(
    "svc-tab-json-editor-textarea",
    JsonEditorTab,
  );
  SvgRegistry.registerIcon("icon-fb-format-json", FORMAT_ICON);
}
