import type { SurveyCreatorModel } from "survey-creator-core";
import { ComputedUpdater } from "survey-core";
import { onScopeDispose } from "vue";
import useCreatorToolbarAction from "./useCreatorToolbarAction.ts";
import useLocalI18n from "./useLocalI18n.ts";
import { general } from "../locales/index.ts";

// The open JSON tab's format function, per creator
const formatters = new WeakMap<SurveyCreatorModel, () => void>();

/** Lets the toolbar's Format JSON button format this JSON tab while it is open. */
export function useJsonFormatter(creator: SurveyCreatorModel, format: () => void): void {
  formatters.set(creator, format);
  onScopeDispose(() => {
    if (formatters.get(creator) === format) formatters.delete(creator);
  });
}

/**
 * The toolbar's Format JSON button, for as long as the creator lives. The JSON
 * tab mounts and unmounts as the creator switches tabs, and a toolbar action
 * added or removed during that switch leaves the creator showing the old tab
 * for every later switch, so the button cannot live with the tab.
 */
export default function useJsonFormatAction(creator: SurveyCreatorModel): void {
  const { t } = useLocalI18n(general);
  useCreatorToolbarAction(
    creator,
    {
      id: "fb-json-format",
      iconName: "icon-fb-format-json",
      iconSize: "auto",
      mode: "small",
      visible: new ComputedUpdater(
        () => creator.activeTab === "json" && !creator.readOnly,
      ),
      action: () => formatters.get(creator)?.(),
    },
    () => `${t("formatJson")} (Shift+Alt+F)`,
  );
}
