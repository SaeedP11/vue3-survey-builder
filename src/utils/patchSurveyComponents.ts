import { ComponentFactory } from "survey-vue3-ui";

function patchComponent(comp: any): void {
  if (!comp || typeof comp !== "object") return;
  const target = comp.__vccOpts || comp;
  target.inheritAttrs = false;
  comp.inheritAttrs = false;
  const props = target.props || comp.props;
  if (props && typeof props === "object") {
    Object.assign(props, {
      itemData: {},
      survey: {},
      page: {},
    });
  }
}

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
    patchComponent(ComponentFactory.Instance.getComponent(name));
  }

  const factory = ComponentFactory.Instance as any;
  if (
    factory &&
    !factory.__patchSurveyComponentsHooked &&
    typeof factory.registerComponent === "function"
  ) {
    factory.__patchSurveyComponentsHooked = true;
    const origRegister = factory.registerComponent.bind(factory);
    factory.registerComponent = (name: string, comp: any) => {
      if (componentNames.includes(name)) {
        patchComponent(comp);
      }
      return origRegister(name, comp);
    };
  }
}
