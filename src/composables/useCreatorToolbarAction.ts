import type { SurveyCreatorModel } from "survey-creator-core";
import type { IAction } from "survey-core";
import { onScopeDispose, watch } from "vue";

/**
 * Adds an icon-only button to the creator's toolbar while the calling scope
 * lives. `title` names it (tooltip and accessible name), and is re-read when
 * it changes, e.g. with the locale.
 */
export default function useCreatorToolbarAction(
  creator: SurveyCreatorModel,
  action: IAction & { id: string },
  title?: () => string,
): void {
  creator.toolbar.removeActionById(action.id);
  const added = creator.toolbar.addAction({
    showTitle: false,
    ...action,
    title: title?.() ?? action.title,
  });
  if (title) watch(title, (next) => (added.title = next));
  onScopeDispose(() => {
    creator.toolbar.removeActionById(action.id);
  });
}
