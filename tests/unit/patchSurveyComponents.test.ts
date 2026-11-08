import { describe, expect, it } from "vitest";
import { ComponentFactory } from "survey-vue3-ui";
import { patchSurveyComponents } from "../../src/utils/patchSurveyComponents";

describe("patchSurveyComponents", () => {
  it("patches sv-list-item-content and sv-list-item-group with inheritAttrs: false and non-prop attributes", () => {
    patchSurveyComponents();

    for (const name of ["sv-list-item-content", "sv-list-item-group"]) {
      const comp = ComponentFactory.Instance.getComponent(name) as any;
      expect(comp).toBeDefined();
      expect(comp.inheritAttrs).toBe(false);
      expect(comp.props).toHaveProperty("itemData");
      expect(comp.props).toHaveProperty("survey");
      expect(comp.props).toHaveProperty("page");
    }
  });
});
