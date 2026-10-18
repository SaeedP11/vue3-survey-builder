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
        images: [],
        // Drag these about in the result editor; the HTML blocks fill in from
        // the score and the answers on the Preview tab
        layout: [
          { id: "hero", type: "hero" },
          { id: "score", type: "score" },
          {
            id: "html-summary",
            type: "html",
            html: '<p style="margin:0;text-align:center">Your score is <strong>{$score}</strong>: <strong>{$status}</strong> risk.</p>',
          },
          {
            id: "html-high",
            type: "html",
            tier: 3,
            html: '<div style="padding:12px 16px;border-radius:12px;background:#fdecec;color:#7a1c1c"><strong>Please book a check-up soon.</strong> At {age}, a reading of {systolic} mmHg is worth a doctor\'s look.</div>',
          },
          { id: "note", type: "note" },
          { id: "divider-1", type: "divider" },
          { id: "actions", type: "actions" },
        ],
        actions: [
          {
            id: "book",
            label: "Book a consultation",
            type: "link",
            variant: "primary",
            icon: "calendar",
            // The answer goes into the link: try it from the Preview tab
            url: "https://example.com/book?score={riskScore}",
            newTab: true,
            // Only a high score sees it; the result editor shows it with its range
            scoreMin: 45,
          },
          {
            id: "print",
            label: "Save as PDF",
            type: "print",
            variant: "secondary",
            icon: "download",
          },
          {
            id: "again",
            label: "Take the test again",
            type: "restart",
            variant: "text",
            icon: "restart",
          },
        ],
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
  {
    id: "charts",
    name: "Chart question",
    json: {
      title: "Daily wellbeing",
      description:
        "Built-in chart questions drawing the answers above them, live in the Preview tab.",
      pages: [
        {
          name: "page1",
          elements: [
            { type: "text", name: "sleep", title: "Hours of sleep", inputType: "number", min: 0, max: 24 },
            { type: "text", name: "water", title: "Glasses of water", inputType: "number", min: 0 },
            { type: "text", name: "steps", title: "Steps (thousands)", inputType: "number", min: 0 },
            {
              type: "rating",
              name: "mood",
              title: "Mood",
              rateMax: 10,
            },
            {
              type: "chart",
              name: "today",
              title: "Today at a glance",
              chartType: "bar",
              items: [
                { value: "sleep", text: "Sleep (h)", expression: "{sleep}" },
                { value: "water", text: "Water (glasses)", expression: "{water}" },
                { value: "steps", text: "Steps (k)", expression: "{steps}" },
                { value: "mood", text: "Mood", expression: "{mood}" },
              ],
            },
            {
              type: "chart",
              name: "week",
              title: "Sleep this week (today is the last point)",
              chartType: "line",
              unit: "h",
              maxValue: 12,
              items: [
                { value: "mon", text: "Mon", expression: "7" },
                { value: "tue", text: "Tue", expression: "6.5" },
                { value: "wed", text: "Wed", expression: "8" },
                { value: "thu", text: "Thu", expression: "5.5" },
                { value: "fri", text: "Fri", expression: "7.5" },
                { value: "sat", text: "Sat", expression: "9" },
                { value: "today", text: "Today", expression: "{sleep}" },
              ],
            },
            {
              type: "chart",
              name: "day",
              title: "How the day splits",
              chartType: "donut",
              unit: "h",
              items: [
                { value: "sleep", text: "Sleep", expression: "{sleep}" },
                { value: "rest", text: "Awake", expression: "24 - {sleep}" },
              ],
            },
            {
              type: "chart",
              name: "goals",
              title: "Goals reached (%)",
              chartType: "horizontalBar",
              unit: "%",
              maxValue: 100,
              items: [
                { value: "sleep", text: "Sleep (8 h)", expression: "min(100, {sleep} / 8 * 100)" },
                { value: "water", text: "Water (8 glasses)", expression: "min(100, {water} / 8 * 100)" },
                { value: "steps", text: "Steps (10k)", expression: "min(100, {steps} * 10)" },
              ],
            },
          ],
        },
      ],
    },
  },
];
