import { ComponentFactory } from "survey-vue3-ui";

/**
 * Patches SurveyJS Vue 3 components to prevent Vue extraneous non-props warnings.
 *
 * `ListItem` in `survey-vue3-ui` passes `itemData`, `survey`, and `page` to its item content component.
 * However, the default `sv-list-item-content` and `sv-list-item-group` components render fragment root nodes
 * and only declare `model` and `item` in props. Vue 3 warns that extraneous non-props attributes
 * cannot be automatically inherited by fragment root nodes.
 *
 * Setting `inheritAttrs = false` and registering `itemData`, `survey`, and `page` in props silences
 * the warning and properly accepts the attributes.
 */
export function patchSurveyComponents(): void {
  const componentNames = ["sv-list-item-content", "sv-list-item-group"];
  for (const name of componentNames) {
    const comp = ComponentFactory.Instance.getComponent(name);
    if (comp && typeof comp === "object") {
      (comp as Record<string, unknown>).inheritAttrs = false;
      const props = (comp as { props?: Record<string, unknown> }).props;
      if (props && typeof props === "object") {
        Object.assign(props, {
          itemData: {},
          survey: {},
          page: {},
        });
      }
    }
  }
}
