/** Surveys the playground can load into the designer. */
export interface Sample {
  id: string;
  name: string;
  json: object;
}

export const SAMPLES: Sample[] = [
  {
    id: "blank",
    name: "Blank",
    json: {},
  },
  {
    id: "heart-risk",
    name: "Heart risk (result template)",
    json: {
      title: "Heart risk check",
      description:
        "Complete it in the Preview tab to see the result template, fed by the riskScore calculated value.",
      icon: "HeartPulse",
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "text",
              name: "age",
              title: "Age",
              inputType: "number",
              min: 18,
              max: 100,
              isRequired: true,
            },
            {
              type: "boolean",
              name: "smoker",
              title: "Do you smoke?",
              isRequired: true,
            },
            {
              type: "text",
              name: "systolic",
              title: "Systolic blood pressure (mmHg)",
              inputType: "number",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "activity",
              title: "How often do you exercise?",
              isRequired: true,
              choices: [
                { value: 0, text: "Three times a week or more" },
                { value: 10, text: "Once or twice a week" },
                { value: 20, text: "Rarely" },
              ],
            },
          ],
        },
      ],
      calculatedValues: [
        {
          name: "riskScore",
          expression:
            "iif({smoker}, 25, 0) + iif({age} > 50, 20, 0) + iif({systolic} > 140, 25, iif({systolic} > 120, 10, 0)) + {activity}",
          includeIntoResult: true,
        },
      ],
      resultTemplate: {
        scoreDisplay: "radial",
        score: "riskScore",
        min: 0,
        max: 90,
        tableRows: [],
        logoSrc: "",
        brandName: "Playground",
        brandTagline: "Form builder test bench",
        categoryChip: "Heart health",
        title: "Assessment complete",
        subtitle: "Cardiovascular risk",
        description: "A made-up score from four answers, to exercise the template.",
        noteText: "Not medical advice: the formula is invented for the playground.",
        primaryLabel: "Book a consultation",
        secondaryLabel: "Download results (PDF)",
        closeLabel: "Close",
        statusLabels: ["Low", "Moderate", "High", "Very high"],
      },
    },
  },
  {
    id: "custom-types",
    name: "Custom question types and logic",
    json: {
      title: "Custom question types",
      description:
        "An async dropdown, an advanced text input and a custom 'reminder' trigger, all registered by the playground.",
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "asyncDropdown",
              name: "country",
              title: "Where do you live? (async dropdown: search and page the list)",
              isRequired: true,
            },
            {
              type: "countryAsync",
              name: "favourite",
              title:
                "Favourite country (advanced text input: in the designer, pick from the question's type button)",
            },
            {
              type: "rating",
              name: "satisfaction",
              title: "How satisfied are you? (2 or less fires the reminder)",
              rateMax: 5,
            },
          ],
        },
      ],
      triggers: [{ type: "reminder", expression: "{satisfaction} <= 2" }],
    },
  },
];
