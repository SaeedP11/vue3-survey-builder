/**
 * Collection of rich, realistic example forms specifically crafted to showcase
 * Chat Mode across diverse business domains, container layouts, question types,
 * widgets, branching logic, and internationalization (English & Persian RTL).
 */

export interface ChatSample {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  typesUsed: string[];
  persona: {
    name: string;
    greeting: string;
    avatarUrl?: string;
  };
  json: Record<string, unknown>;
}

// Inline SVG cards for image picker questions
const svgCard = (bg: string, icon: string, title: string) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
      <defs>
        <linearGradient id="g_${title}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="160" height="120" rx="12" fill="url(#g_${title})"/>
      <g fill="#ffffff" transform="translate(64, 30) scale(1.3)">
        ${icon}
      </g>
      <text x="80" y="98" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
        ${title}
      </text>
    </svg>
  `);

const CLOUD_ICON = `<path d="M4 10a4 4 0 0 1 7.87-1A4.5 4.5 0 0 1 20.5 13a4.5 4.5 0 0 1-4.5 4.5H4A4 4 0 0 1 4 10z"/>`;
const AI_ICON = `<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`;
const DESIGN_ICON = `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`;
const SHIELD_ICON = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`;

export const CHAT_SAMPLES: ChatSample[] = [
  // 1. Customer Support & Incident Triage
  {
    id: "customer-support",
    name: "Customer Support & Incident Triage",
    category: "Support & Helpdesk",
    badge: "Branching + File Upload",
    description: "Support ticket triage bot with incident category, conditional invoice/error questions, severity ratings, screenshot upload, and permission checks.",
    typesUsed: ["text", "radiogroup", "rating", "comment", "file", "boolean", "dropdown"],
    persona: {
      name: "Support Concierge",
      greeting: "Hello! 👋 I'm your support assistant. Let's gather the details so our engineering team can resolve your issue swiftly.",
    },
    json: {
      title: "Technical Support & Incident Triage",
      description: "Fast-track issue reporting and ticket routing.",
      pages: [
        {
          name: "support_page",
          elements: [
            {
              type: "text",
              name: "requesterName",
              title: "What is your full name?",
              placeholder: "Jane Doe",
              isRequired: true,
            },
            {
              type: "text",
              name: "requesterEmail",
              title: "What is your email address so we can reply?",
              placeholder: "jane@company.com",
              inputType: "email",
              isRequired: true,
              validators: [{ type: "email", text: "Please enter a valid email address." }],
            },
            {
              type: "radiogroup",
              name: "issueCategory",
              title: "Which area is this issue related to?",
              isRequired: true,
              choices: [
                { value: "billing", text: "Billing & Invoices" },
                { value: "account", text: "Account Access / Authentication" },
                { value: "bug", text: "Software Bug / Broken Feature" },
                { value: "performance", text: "Slow Performance / Outage" },
                { value: "general", text: "General Inquiry" },
              ],
            },
            {
              type: "text",
              name: "invoiceNumber",
              title: "Please enter your Invoice Number or Transaction ID:",
              placeholder: "INV-2026-089",
              visibleIf: "{issueCategory} = 'billing'",
              isRequired: true,
            },
            {
              type: "dropdown",
              name: "affectedPlatform",
              title: "Which environment or platform was affected?",
              visibleIf: "{issueCategory} = 'bug' or {issueCategory} = 'performance'",
              isRequired: true,
              choices: [
                { value: "chrome", text: "Google Chrome (Desktop)" },
                { value: "firefox", text: "Mozilla Firefox" },
                { value: "safari", text: "Apple Safari (macOS / iOS)" },
                { value: "mobile_app", text: "Mobile App (iOS / Android)" },
                { value: "api", text: "REST API / Webhooks" },
              ],
            },
            {
              type: "rating",
              name: "severity",
              title: "How severely does this disrupt your work? (1 = Minor glitch, 5 = Critical blocker)",
              rateMin: 1,
              rateMax: 5,
              isRequired: true,
            },
            {
              type: "comment",
              name: "issueDescription",
              title: "Please describe what happened and the steps to reproduce:",
              placeholder: "1. Click on export button\n2. Dialog shows blank spinner\n3. Console error 500",
              isRequired: true,
            },
            {
              type: "file",
              name: "errorScreenshots",
              title: "Attach any relevant screenshots or error log files (optional):",
              maxSize: 10485760,
              allowMultiple: true,
            },
            {
              type: "boolean",
              name: "grantStagingAccess",
              title: "Do you grant our engineering team permission to inspect your staging workspace?",
              isRequired: true,
            },
            {
              type: "dropdown",
              name: "preferredChannel",
              title: "How would you prefer our team to follow up with you?",
              choices: [
                { value: "email", text: "Email notification" },
                { value: "slack", text: "Shared Slack Connect channel" },
                { value: "call", text: "Urgent phone call (blockers only)" },
              ],
            },
          ],
        },
      ],
    },
  },

  // 2. Product Feedback & NPS
  {
    id: "nps-feedback",
    name: "Product Feedback & Net Promoter Score (NPS)",
    category: "Feedback & CSAT",
    badge: "NPS + Dynamic Logic",
    description: "Net Promoter Score survey with adaptive branching for Promoters (9-10), Passives (7-8), and Detractors (0-6), plus testimonial consent.",
    typesUsed: ["rating", "radiogroup", "checkbox", "comment", "boolean", "text"],
    persona: {
      name: "Product Insights Bot",
      greeting: "Hi there! 👋 Your opinion shapes our roadmap. We have a brief 2-minute pulse check for you.",
    },
    json: {
      title: "Product Feedback & NPS",
      description: "Help us understand your experience and prioritize improvements.",
      pages: [
        {
          name: "nps_page",
          elements: [
            {
              type: "rating",
              name: "npsScore",
              title: "On a scale of 0 to 10, how likely are you to recommend our platform to a colleague or peer?",
              rateMin: 0,
              rateMax: 10,
              isRequired: true,
            },
            // Promoter branch (9-10)
            {
              type: "checkbox",
              name: "promoterHighlights",
              title: "Awesome! What do you enjoy most about using our product?",
              visibleIf: "{npsScore} >= 9",
              choices: [
                { value: "speed", text: "Lightning-fast performance" },
                { value: "chat_mode", text: "Conversational Chat Mode" },
                { value: "clean_ui", text: "Modern, clutter-free interface" },
                { value: "support", text: "Responsive customer support" },
                { value: "customization", text: "Rich widgets & deep extensibility" },
              ],
            },
            // Passive branch (7-8)
            {
              type: "comment",
              name: "passiveImprovements",
              title: "Thanks! What is the single biggest thing we could improve to earn a 10 from you?",
              visibleIf: "{npsScore} >= 7 and {npsScore} <= 8",
              placeholder: "More integrations, faster exports, etc.",
            },
            // Detractor branch (0-6)
            {
              type: "radiogroup",
              name: "detractorPrimaryReason",
              title: "We're sorry to hear that. What was the main reason for your rating?",
              visibleIf: "{npsScore} <= 6",
              choices: [
                { value: "complexity", text: "Too difficult or complex to use" },
                { value: "missing_features", text: "Missing essential features" },
                { value: "bugs", text: "Ran into bugs or stability problems" },
                { value: "pricing", text: "Pricing / value ratio" },
                { value: "support_slowness", text: "Slow customer service" },
              ],
            },
            {
              type: "comment",
              name: "detractorDetail",
              title: "Could you share a little more context so we can address it directly?",
              visibleIf: "{npsScore} <= 6",
            },
            // Overall Star Rating
            {
              type: "rating",
              name: "updateSatisfaction",
              title: "How satisfied are you with our latest monthly feature releases?",
              rateMax: 5,
            },
            {
              type: "boolean",
              name: "testimonialConsent",
              title: "May we feature your positive remarks as an anonymous testimonial on our website?",
              visibleIf: "{npsScore} >= 8",
            },
            {
              type: "text",
              name: "interviewEmail",
              title: "Enter your email if you'd be open to a 20-min product interview (includes $50 Amazon gift card):",
              inputType: "email",
            },
          ],
        },
      ],
    },
  },

  // 3. Employee Onboarding & Equipment Setup
  {
    id: "employee-onboarding",
    name: "Employee Onboarding & Equipment Request",
    category: "HR & People Ops",
    badge: "Signature + File Upload",
    description: "New hire welcome bot collecting start dates, workstation preferences via multi-select chips, ID document scan, and digital canvas signature.",
    typesUsed: ["text", "radiogroup", "checkbox", "dropdown", "file", "boolean", "signaturepad"],
    persona: {
      name: "Alex from People Ops",
      greeting: "Welcome to the team! 🎉 Let's configure your developer workstation and complete your new-hire verification.",
    },
    json: {
      title: "New Hire Onboarding & Hardware Kit",
      description: "Equipment selection and digital agreement.",
      pages: [
        {
          name: "onboarding_page",
          elements: [
            {
              type: "text",
              name: "legalName",
              title: "What is your full legal name?",
              placeholder: "Alex Morgan",
              isRequired: true,
            },
            {
              type: "text",
              name: "preferredName",
              title: "What preferred name or handle should we set up for you?",
              placeholder: "Alex",
            },
            {
              type: "text",
              name: "startDate",
              title: "Confirm your first official day:",
              inputType: "date",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "workArrangement",
              title: "What is your primary work arrangement?",
              isRequired: true,
              choices: [
                { value: "remote", text: "100% Fully Remote" },
                { value: "hybrid", text: "Hybrid (2-3 days office)" },
                { value: "office", text: "HQ On-Site" },
              ],
            },
            {
              type: "radiogroup",
              name: "laptopChoice",
              title: "Select your primary engineering workstation:",
              isRequired: true,
              choices: [
                { value: "mac_16", text: "MacBook Pro 16\" (M3 Max / 64GB RAM)" },
                { value: "mac_14", text: "MacBook Pro 14\" (M3 Pro / 36GB RAM)" },
                { value: "thinkpad", text: "Lenovo ThinkPad X1 Carbon (Ubuntu Linux)" },
                { value: "dell_xps", text: "Dell XPS 15 (Windows 11 Pro / 64GB)" },
              ],
            },
            {
              type: "checkbox",
              name: "peripherals",
              title: "Select the workspace peripherals you'd like us to ship to your home:",
              choices: [
                { value: "monitors", text: "Dual 27\" 4K USB-C Monitors" },
                { value: "mech_keyboard", text: "Ergonomic Mechanical Keyboard" },
                { value: "vertical_mouse", text: "Wireless Ergonomic Vertical Mouse" },
                { value: "noise_headphones", text: "ANC Wireless Noise-Cancelling Headphones" },
                { value: "webcam_4k", text: "4K Studio Streaming Webcam" },
                { value: "desk_mat", text: "Anti-Fatigue Standing Desk Mat" },
              ],
            },
            {
              type: "dropdown",
              name: "hoodieSize",
              title: "What size company hoodie & welcome swag should we pack?",
              choices: [
                { value: "xs", text: "XS - Extra Small" },
                { value: "s", text: "S - Small" },
                { value: "m", text: "M - Medium" },
                { value: "l", text: "L - Large" },
                { value: "xl", text: "XL - Extra Large" },
                { value: "2xl", text: "2XL - Double XL" },
              ],
            },
            {
              type: "file",
              name: "idVerification",
              title: "Please upload a photo of your Passport or National ID for employment verification:",
              isRequired: true,
              maxSize: 10485760,
            },
            {
              type: "boolean",
              name: "codeOfConductAgreement",
              title: "I acknowledge that I have read and agree to abide by the Company Code of Conduct and Data Security Policy.",
              isRequired: true,
            },
            {
              type: "signaturepad",
              name: "employeeSignature",
              title: "Please draw your signature below to finalize your equipment kit and agreement:",
              isRequired: true,
            },
          ],
        },
      ],
    },
  },

  // 4. Enterprise Lead Qualification & Visual Solution Match
  {
    id: "sales-qualification",
    name: "Enterprise Lead Qualification & Solution Match",
    category: "Sales & Consultation",
    badge: "Image Choice Cards",
    description: "B2B discovery bot featuring company size dropdown, visual solution cards (imagepicker), budget tiers, email validation, and live demo booking.",
    typesUsed: ["text", "dropdown", "imagepicker", "radiogroup", "boolean", "comment"],
    persona: {
      name: "Sam - Solutions Architect",
      greeting: "Hello! 👋 Exploring solutions for your team? Answer 5 quick questions so we can tailor the right architecture.",
    },
    json: {
      title: "Enterprise Solutions Discovery",
      description: "Match your team with the optimal deployment architecture.",
      pages: [
        {
          name: "lead_page",
          elements: [
            {
              type: "text",
              name: "companyName",
              title: "What is your company or organization name?",
              placeholder: "Acme Corporation",
              isRequired: true,
            },
            {
              type: "dropdown",
              name: "companySize",
              title: "How many employees are in your organization?",
              isRequired: true,
              choices: [
                { value: "seed", text: "1 - 15 employees (Seed / Early Stage)" },
                { value: "growth", text: "16 - 75 employees (Growth)" },
                { value: "midmarket", text: "76 - 300 employees (Mid-Market)" },
                { value: "enterprise", text: "300+ employees (Enterprise)" },
              ],
            },
            {
              type: "imagepicker",
              name: "primarySolution",
              title: "Which core capability are you looking to implement?",
              isRequired: true,
              choices: [
                {
                  value: "cloud_infra",
                  text: "Cloud Architecture",
                  imageLink: svgCard("#2563eb", CLOUD_ICON, "Cloud Infra"),
                },
                {
                  value: "ai_workflows",
                  text: "AI & Agents",
                  imageLink: svgCard("#7c3aed", AI_ICON, "AI & Agents"),
                },
                {
                  value: "design_system",
                  text: "Design System",
                  imageLink: svgCard("#db2777", DESIGN_ICON, "Design System"),
                },
                {
                  value: "security_audit",
                  text: "Cybersecurity",
                  imageLink: svgCard("#059669", SHIELD_ICON, "Security"),
                },
              ],
            },
            {
              type: "radiogroup",
              name: "annualBudget",
              title: "What is your anticipated annual software & services budget?",
              isRequired: true,
              choices: [
                { value: "tier1", text: "Under $10,000 / year" },
                { value: "tier2", text: "$10,000 - $35,000 / year" },
                { value: "tier3", text: "$35,000 - $100,000 / year" },
                { value: "tier4", text: "$100,000+ / Enterprise Custom" },
              ],
            },
            {
              type: "radiogroup",
              name: "projectTimeline",
              title: "When are you planning to roll this out?",
              choices: [
                { value: "asap", text: "Immediately (within 2-4 weeks)" },
                { value: "quarter", text: "This quarter (1-3 months)" },
                { value: "future", text: "Later this year (exploratory)" },
              ],
            },
            {
              type: "text",
              name: "workEmail",
              title: "What is your work email address?",
              inputType: "email",
              placeholder: "you@company.com",
              isRequired: true,
              validators: [{ type: "email", text: "Please enter a valid corporate email." }],
            },
            {
              type: "boolean",
              name: "requestLiveDemo",
              title: "Would you like our engineering lead to schedule a live 30-minute technical walkthrough?",
            },
            {
              type: "comment",
              name: "customRequirements",
              title: "Any existing stack constraints or integrations you need us to support?",
              placeholder: "e.g. Self-hosted Kubernetes, SSO / SAML, HIPAA compliance...",
            },
          ],
        },
      ],
    },
  },

  // 5. Software Usability Evaluation Matrix & Roadmap Priority
  {
    id: "usability-matrix",
    name: "Software Usability Matrix & Feature Roadmap",
    category: "Product & UX Research",
    badge: "Matrix + Ranking",
    description: "Comprehensive UX evaluation with sequential matrix cards for core platform pillars, and drag-and-drop ranking for upcoming roadmap features.",
    typesUsed: ["dropdown", "matrix", "ranking", "rating", "comment"],
    persona: {
      name: "UX Research Lead",
      greeting: "Hello developer! 🔬 Help us evaluate our platform's UX ergonomics and vote on our next quarter priorities.",
    },
    json: {
      title: "Platform Usability Survey & Roadmap Prioritization",
      description: "Standard SUS evaluation and interactive feature voting.",
      pages: [
        {
          name: "ux_page",
          elements: [
            {
              type: "dropdown",
              name: "developerRole",
              title: "What best describes your day-to-day role?",
              isRequired: true,
              choices: [
                { value: "frontend", text: "Frontend Engineer (Vue / React)" },
                { value: "fullstack", text: "Full-Stack Developer" },
                { value: "backend", text: "Backend / Microservices Engineer" },
                { value: "designer", text: "UI/UX & Product Designer" },
                { value: "lead", text: "Engineering Lead / Architect" },
              ],
            },
            {
              type: "matrix",
              name: "susMatrix",
              title: "Please rate the following statements about using our survey builder:",
              isRequired: true,
              columns: [
                { value: 1, text: "Strongly Disagree" },
                { value: 2, text: "Disagree" },
                { value: 3, text: "Neutral" },
                { value: 4, text: "Agree" },
                { value: 5, text: "Strongly Agree" },
              ],
              rows: [
                { value: "intuitive", text: "The component APIs feel intuitive and predictable" },
                { value: "performance", text: "The UI renders swiftly without stutter or lag" },
                { value: "responsive", text: "Forms adapt seamlessly across small & wide viewports" },
                { value: "accessibility", text: "Keyboard navigation and screen reader support feel solid" },
              ],
            },
            {
              type: "ranking",
              name: "featurePriorities",
              title: "Rank these 5 upcoming roadmap items from most to least important to your workflow:",
              isRequired: true,
              choices: [
                { value: "offline_pwa", text: "Offline PWA & Local Storage Sync" },
                { value: "ai_generation", text: "AI Natural Language Survey Generator" },
                { value: "advanced_analytics", text: "Live Visual Analytics & Funnel Charts" },
                { value: "pdf_exporter", text: "High-Fidelity PDF / Print Exporter" },
                { value: "multi_step_wizard", text: "Branching Step Wizard with Breadcrumbs" },
              ],
            },
            {
              type: "rating",
              name: "overallNps",
              title: "How likely are you to recommend this library to another engineering team?",
              rateMax: 10,
            },
            {
              type: "comment",
              name: "biggestFrustration",
              title: "What is one papercut or missing feature that would save you the most hours?",
            },
          ],
        },
      ],
    },
  },

  // 6. Telehealth Patient Intake & Symptom Triage
  {
    id: "telehealth-intake",
    name: "Telehealth Patient Intake & Symptom Triage",
    category: "Healthcare & Clinical",
    badge: "Clinical Triage + Signature",
    description: "Confidential clinical intake bot evaluating symptoms, pain scale (0-10), conditional allergy details, medical history, and digital authorization.",
    typesUsed: ["text", "radiogroup", "rating", "checkbox", "boolean", "file", "signaturepad", "dropdown"],
    persona: {
      name: "Clinical Triage Assistant",
      greeting: "Hello. Before your consultation with the physician, let's complete a confidential symptom assessment.",
    },
    json: {
      title: "Pre-Consultation Clinical Intake",
      description: "Confidential medical screening and symptom assessment.",
      pages: [
        {
          name: "clinic_page",
          elements: [
            {
              type: "text",
              name: "patientAge",
              title: "What is the patient's age?",
              inputType: "number",
              min: 1,
              max: 120,
              placeholder: "32",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "biologicalSex",
              title: "Biological sex assigned at birth:",
              isRequired: true,
              choices: [
                { value: "female", text: "Female" },
                { value: "male", text: "Male" },
                { value: "other", text: "Intersex / Prefer not to specify" },
              ],
            },
            {
              type: "radiogroup",
              name: "primaryComplaint",
              title: "What is the main reason for today's appointment?",
              isRequired: true,
              choices: [
                { value: "cold_flu", text: "Cold / Flu / Respiratory symptoms" },
                { value: "headache", text: "Severe Headache / Migraine" },
                { value: "joint_pain", text: "Muscle / Joint / Back pain" },
                { value: "digestive", text: "Digestive / Stomach issues" },
                { value: "skin", text: "Dermatology / Rash / Skin issue" },
                { value: "refill", text: "Routine Prescription Refill" },
              ],
            },
            {
              type: "rating",
              name: "painLevel",
              title: "Current pain or discomfort level (0 = No pain, 10 = Severe/Unbearable):",
              rateMin: 0,
              rateMax: 10,
              isRequired: true,
            },
            {
              type: "checkbox",
              name: "urgentSymptoms",
              title: "Are you experiencing any of these high-priority warning signs?",
              choices: [
                { value: "fever", text: "High fever (> 38.5°C / 101.3°F)" },
                { value: "dyspnea", text: "Shortness of breath or chest pressure" },
                { value: "dizziness", text: "Sudden dizziness or loss of balance" },
                { value: "nausea", text: "Persistent vomiting or inability to keep liquids down" },
                { value: "none", text: "None of the above" },
              ],
            },
            {
              type: "boolean",
              name: "hasDrugAllergies",
              title: "Do you have any known allergies to medications (e.g., Penicillin, NSAIDs, Sulfa)?",
              isRequired: true,
            },
            {
              type: "text",
              name: "allergyDetails",
              title: "Please list your known drug allergies and reactions:",
              placeholder: "Penicillin - hives, Ibuprofen - swelling",
              visibleIf: "{hasDrugAllergies} = true",
              isRequired: true,
            },
            {
              type: "dropdown",
              name: "insuranceProvider",
              title: "Select your primary health insurance carrier:",
              choices: [
                { value: "bcbs", text: "Blue Cross Blue Shield" },
                { value: "aetna", text: "Aetna Healthcare" },
                { value: "united", text: "UnitedHealthcare" },
                { value: "cigna", text: "Cigna" },
                { value: "medicare", text: "Medicare / Medicaid" },
                { value: "self_pay", text: "Self-Pay / Non-insured" },
              ],
            },
            {
              type: "file",
              name: "medicalDocuments",
              title: "Attach photos of the affected area or previous lab test records (optional):",
              maxSize: 10485760,
            },
            {
              type: "boolean",
              name: "consentTelehealth",
              title: "I authorize telehealth treatment and consent to electronic medical record management.",
              isRequired: true,
            },
            {
              type: "signaturepad",
              name: "patientConsentSignature",
              title: "Please sign in the box below to authorize clinical triage:",
              isRequired: true,
            },
          ],
        },
      ],
    },
  },

  // 7. Tech Summit & Hackathon Registration
  {
    id: "tech-summit-rsvp",
    name: "Tech Summit & Hackathon Registration",
    category: "Events & Community",
    badge: "Conditional Questions",
    description: "Event registration bot handling in-person vs virtual attendance, conditional dietary preferences, conference track selection, and hackathon team status.",
    typesUsed: ["text", "radiogroup", "checkbox", "dropdown", "boolean"],
    persona: {
      name: "Summit Host",
      greeting: "Hey there! 🎉 Registration for the 2026 Global Engineering Summit is open. Let's reserve your attendee badge!",
    },
    json: {
      title: "Global Engineering Summit 2026",
      description: "Join 2,500+ builders in San Francisco and online.",
      pages: [
        {
          name: "rsvp_page",
          elements: [
            {
              type: "text",
              name: "attendeeName",
              title: "Full Name (as it should appear on your badge):",
              placeholder: "Jordan Lee",
              isRequired: true,
            },
            {
              type: "text",
              name: "attendeeEmail",
              title: "Primary Email Address:",
              placeholder: "jordan@example.com",
              inputType: "email",
              isRequired: true,
              validators: [{ type: "email", text: "Valid email required for ticket QR code." }],
            },
            {
              type: "radiogroup",
              name: "attendanceType",
              title: "How will you be joining us?",
              isRequired: true,
              choices: [
                { value: "in_person", text: "In-Person (San Francisco Convention Center)" },
                { value: "virtual", text: "Virtual Livestream & Discord Community" },
              ],
            },
            {
              type: "checkbox",
              name: "dietaryRequirements",
              title: "Do you have any dietary restrictions for conference catering?",
              visibleIf: "{attendanceType} = 'in_person'",
              choices: [
                { value: "vegetarian", text: "Vegetarian" },
                { value: "vegan", text: "Vegan" },
                { value: "gluten_free", text: "Gluten-Free" },
                { value: "halal", text: "Halal" },
                { value: "kosher", text: "Kosher" },
                { value: "nut_allergy", text: "Severe Nut Allergy" },
                { value: "none", text: "No Restrictions" },
              ],
            },
            {
              type: "dropdown",
              name: "conferenceTrack",
              title: "Which afternoon technical deep-dive track are you most interested in?",
              choices: [
                { value: "frontend_motion", text: "Modern Frontend, Micro-Interactions & Motion" },
                { value: "ai_agents", text: "Autonomous Multi-Agent AI Architectures" },
                { value: "distributed_systems", text: "High-Throughput Distributed Systems in Rust/Go" },
                { value: "cloud_security", text: "Zero-Trust Cloud & Identity Engineering" },
              ],
            },
            {
              type: "boolean",
              name: "participateHackathon",
              title: "Will you compete in the $50,000 Saturday 24-hour Hackathon?",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "hackathonTeam",
              title: "What is your hackathon team status?",
              visibleIf: "{participateHackathon} = true",
              choices: [
                { value: "formed_team", text: "I already have a team ready (2-4 members)" },
                { value: "needs_team", text: "I'd like to be matched during Friday team mixer" },
                { value: "solo", text: "I plan to compete solo" },
              ],
            },
            {
              type: "text",
              name: "githubOrTwitter",
              title: "GitHub username or portfolio link (optional):",
              placeholder: "github.com/jordanlee",
            },
          ],
        },
      ],
    },
  },

  // 8. Daily Wellbeing Check-in with Live Chart & Scorecard Result
  {
    id: "wellbeing-scorecard",
    name: "Daily Wellbeing & Habits Tracker",
    category: "Health & Widgets",
    badge: "Live Chart + Scorecard",
    description: "Wellness habit check-in that takes sleep, water, and activity metrics, renders a live bar chart widget inside the chat, calculates a Vitality Score, and reveals an end-of-chat scorecard.",
    typesUsed: ["text", "rating", "chart", "calculatedValues", "resultTemplate"],
    persona: {
      name: "Wellness Coach",
      greeting: "Good day! ☀️ Let's do your daily wellbeing check-in and calculate your Vitality Score.",
    },
    json: {
      title: "Daily Wellbeing & Vitality Check-in",
      description: "Log your health habits and view your live chart and scorecard.",
      pages: [
        {
          name: "habits_page",
          elements: [
            {
              type: "text",
              name: "sleepHours",
              title: "How many hours of sleep did you get last night?",
              inputType: "number",
              min: 0,
              max: 24,
              placeholder: "7.5",
              isRequired: true,
            },
            {
              type: "text",
              name: "waterGlasses",
              title: "How many glasses of water have you consumed today?",
              inputType: "number",
              min: 0,
              max: 30,
              placeholder: "8",
              isRequired: true,
            },
            {
              type: "text",
              name: "stepCountK",
              title: "Active steps walked today (in thousands, e.g. 10 for 10,000 steps):",
              inputType: "number",
              min: 0,
              max: 60,
              placeholder: "9.2",
              isRequired: true,
            },
            {
              type: "rating",
              name: "moodScore",
              title: "How would you rate your mental energy and clarity today?",
              rateMin: 1,
              rateMax: 10,
              isRequired: true,
            },
            {
              type: "chart",
              name: "dailyMetricsChart",
              title: "Live Summary of Today's Health Metrics:",
              chartType: "bar",
              items: [
                { value: "sleep", text: "Sleep (h)", expression: "{sleepHours}" },
                { value: "water", text: "Water (glasses)", expression: "{waterGlasses}" },
                { value: "steps", text: "Steps (k)", expression: "{stepCountK}" },
                { value: "mood", text: "Mood (1-10)", expression: "{moodScore}" },
              ],
            },
          ],
        },
      ],
      calculatedValues: [
        {
          name: "vitalityScore",
          expression:
            "min(100, round(({sleepHours} / 8 * 30) + ({waterGlasses} / 8 * 25) + ({stepCountK} / 10 * 25) + ({moodScore} * 2)))",
          includeIntoResult: true,
        },
      ],
      resultTemplate: {
        scoreDisplay: "radial",
        score: "vitalityScore",
        min: 0,
        max: 100,
        categoryChip: "Wellness Index",
        brandName: "Vitality Coach",
        brandTagline: "Daily Habit Intelligence",
        title: "Daily Assessment Complete",
        subtitle: "Your Computed Vitality Index",
        description: "Your health score is calculated based on sleep duration, hydration, physical movement, and subjective mood.",
        noteText: "Aim for 8 hours of sleep and consistent hydration to maintain peak vitality.",
        layout: [
          { id: "hero", type: "hero" },
          { id: "score", type: "score" },
          {
            id: "html-feedback",
            type: "html",
            html: '<div style="text-align:center;padding:8px;font-size:13px">Vitality Score: <strong>{$score} / 100</strong> &bull; Status: <strong>{$status}</strong></div>',
          },
          { id: "note", type: "note" },
          { id: "actions", type: "actions" },
        ],
        actions: [
          {
            id: "again",
            label: "Log Another Day",
            type: "restart",
            variant: "primary",
            icon: "restart",
          },
        ],
        statusLabels: ["Needs Attention", "Fair Routine", "Good Balance", "Peak Vitality"],
      },
    },
  },

  // 9. Persian Customer Support & Warranty Claim (RTL)
  {
    id: "persian-support",
    name: "پشتیبانی و خدمات پس از فروش (فارسی / RTL)",
    category: "فارسی / RTL Support",
    badge: "راست‌چین + امضا",
    description: "فرم جامع پشتیبانی مشتریان و ثبت گارانتی با چت کاملاً راست‌چین (RTL)، چیپ‌های تعاملی، بارگذاری فایل، و امضای دیجیتال.",
    typesUsed: ["text", "radiogroup", "comment", "file", "rating", "boolean", "signaturepad"],
    persona: {
      name: "پشتیبان آنلاین خدمات",
      greeting: "سلام و درود! 👋 به سامانه پشتیبانی و خدمات پس از فروش خوش آمدید. لطفاً اطلاعات درخواست خود را وارد کنید.",
    },
    json: {
      title: "فرم پشتیبانی و درخواست گارانتی",
      description: "ثبت تیکت و خدمات پس از فروش محصولات",
      pages: [
        {
          name: "support_fa",
          elements: [
            {
              type: "text",
              name: "clientName",
              title: "نام و نام خانوادگی خود را وارد کنید:",
              placeholder: "مثال: علی رضایی",
              isRequired: true,
            },
            {
              type: "text",
              name: "mobileNumber",
              title: "شماره همراه جهت پیگیری و اطلاع‌رسانی پیامکی:",
              placeholder: "۰۹۱۲۳۴۵۶۷۸۹",
              inputType: "tel",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "serviceType",
              title: "نوع درخواست شما مربوط به کدام بخش است؟",
              isRequired: true,
              choices: [
                { value: "warranty", text: "گارانتی و تعمیرات سخت‌افزاری" },
                { value: "software", text: "پشتیبانی نرم‌افزاری و راه‌اندازی" },
                { value: "tracking", text: "پیگیری وضعیت ارسال سفارش" },
                { value: "feedback", text: "انتقادات، پیشنهادات و شکایات" },
              ],
            },
            {
              type: "text",
              name: "serialCode",
              title: "شماره سریال دستگاه یا شماره فاکتور را وارد کنید:",
              visibleIf: "{serviceType} = 'warranty'",
              placeholder: "SN-982143",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "warrantyStatus",
              title: "وضعیت گارانتی محصول خود را مشخص فرمایید:",
              visibleIf: "{serviceType} = 'warranty'",
              choices: [
                { value: "active", text: "دارای گارانتی معتبر شرکتی" },
                { value: "expired", text: "گارانتی منقضی شده (تعمیر آزاد)" },
                { value: "unknown", text: "اطلاع ندارم / نیاز به استعلام" },
              ],
            },
            {
              type: "comment",
              name: "issueDescription",
              title: "لطفاً شرح کامل مشکل رخ داده یا درخواست خود را مرقوم بفرمایید:",
              placeholder: "شرح مشکل، علائم مشاهده شده و...",
              isRequired: true,
            },
            {
              type: "file",
              name: "warrantyCardScan",
              title: "تصویر کارت گارانتی، فاکتور خرید یا عکس دستگاه معیوب را بارگذاری کنید:",
              maxSize: 10485760,
            },
            {
              type: "rating",
              name: "satisfactionRating",
              title: "میزان رضایت کلی شما از پاسخگویی پشتیبانی تا این مرحله:",
              rateMax: 5,
            },
            {
              type: "boolean",
              name: "confirmRules",
              title: "صحت اطلاعات فوق و قوانین خدمات پس از فروش را تایید می‌نمایم.",
              isRequired: true,
            },
            {
              type: "signaturepad",
              name: "digitalSignature",
              title: "جهت ثبت نهایی تیکت، در کادر زیر امضا نمایید:",
              isRequired: true,
            },
          ],
        },
      ],
    },
  },

  // 10. Quick Micro Poll (Compact Sidebar / Widget)
  {
    id: "micro-pulse-poll",
    name: "Quick 60-Second Pulse Check",
    category: "Micro Surveys",
    badge: "Compact & Fast",
    description: "A lightweight 4-question pulse poll ideal for testing compact sidebars, floating widgets, and quick modal popups.",
    typesUsed: ["boolean", "radiogroup", "rating", "comment"],
    persona: {
      name: "Pulse Bot",
      greeting: "Got 30 seconds? 🚀 Help our engineering team optimize today's deployment.",
    },
    json: {
      title: "Daily Developer Pulse",
      description: "Quick 30-second feedback check.",
      pages: [
        {
          name: "pulse_page",
          elements: [
            {
              type: "boolean",
              name: "encounteredLag",
              title: "Did you encounter any unexpected slowness or errors today?",
              isRequired: true,
            },
            {
              type: "radiogroup",
              name: "lagLocation",
              title: "Where did you observe the slowdown?",
              visibleIf: "{encounteredLag} = true",
              choices: [
                { value: "initial_load", text: "Initial page boot & asset loading" },
                { value: "survey_preview", text: "Switching to Survey Preview / Chat tab" },
                { value: "json_sync", text: "Editing JSON or autosave" },
              ],
            },
            {
              type: "radiogroup",
              name: "favoriteMode",
              title: "Which survey presentation mode do you prefer for end-users?",
              choices: [
                { value: "chat", text: "Conversational Chat Mode" },
                { value: "classic", text: "Classic Multi-Page Form" },
                { value: "single_page", text: "All-in-One Single Page" },
              ],
            },
            {
              type: "rating",
              name: "weeklyHappiness",
              title: "Overall sentiment with this week's velocity:",
              rateMax: 5,
              isRequired: true,
            },
          ],
        },
      ],
    },
  },
];
