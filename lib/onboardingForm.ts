import { cmsTermsText } from "./termsText";

export type PortalFormFieldType =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkboxes"
  | "checkbox"
  | "file";

/**
 * A stored "file" answer is an encoded token referencing the client's R2
 * upload for that field (body at form-uploads/{clientId}/{fieldId}). A plain
 * URL string is also legal — the paste-a-link fallback.
 */
const PORTAL_FILE_PREFIX = "portal-file::";

export function encodePortalFileValue(fieldId: string, fileName: string): string {
  return `${PORTAL_FILE_PREFIX}${fieldId}::${fileName}`;
}

export function decodePortalFileValue(value: PortalFormValue | undefined): { fieldId: string; fileName: string } | null {
  if (typeof value !== "string" || !value.startsWith(PORTAL_FILE_PREFIX)) return null;
  const rest = value.slice(PORTAL_FILE_PREFIX.length);
  const sep = rest.indexOf("::");
  if (sep === -1) return null;
  return { fieldId: rest.slice(0, sep), fileName: rest.slice(sep + 2) };
}

export type PortalFormValue = string | string[];
export type PortalFormResponses = Record<string, PortalFormValue>;

export interface PortalFormOption {
  label: string;
  value: string;
  description?: string;
}

export interface PortalFormField {
  id: string;
  label: string;
  type: PortalFormFieldType;
  required?: boolean;
  helper?: string;
  placeholder?: string;
  options?: PortalFormOption[];
  /** Optional instructional extras rendered in a card above the input. */
  inviteEmails?: string[];
  steps?: string[];
  guideUrl?: string;
  guideLabel?: string;
  /** Long-form text (light markdown) shown in a scrollable frame above the input. */
  document?: string;
  /** Muted from the form entirely (not rendered, not counted, not required).
      Flip to re-enable without deleting the field. */
  hidden?: boolean;
  /** For type "file": accepted extensions/MIME types, as an <input accept> string. */
  accept?: string;
  /** A short "Why we need this" note shown under the helper. */
  why?: string;
}

export interface PortalFormSection {
  id: string;
  title: string;
  description?: string;
  fields: PortalFormField[];
  /** Render every field of this section on ONE step (e.g. an address block, so
      browser autofill can fill the whole thing at once). */
  grouped?: boolean;
}

export interface PortalFormDefinition {
  id: string;
  title: string;
  introTitle: string;
  introDescription: string;
  sections: PortalFormSection[];
}

// Adapted from the CSM project's scaleOnboardingForm (respond-csm-dashboard/lib/onboardingForm.ts),
// trimmed to the Meta-only variant per docs/client-portal-task-condensation-report.md:
// Google Ads Manager / Analytics / Tag Manager access dropped, Google My Business kept.
export const scaleOnboardingForm: PortalFormDefinition = {
  id: "scale-onboarding-intake-v1",
  title: "Scale onboarding intake",
  introTitle: "Complete this once so the Scale team can build from one clean source of truth.",
  introDescription: "Please don't type passwords anywhere in this form. Where we need access, invite admin@allconvos.ai instead. If you really must share a password, paste a one-time secret link (for example from onetimesecret.com), never the password itself.",
  sections: [
    {
      id: "business-basics",
      title: "Business basics",
      description: "The core details we need to set up the account cleanly.",
      fields: [
        { id: "website_url", label: "Website URL", type: "url", required: true, placeholder: "https://example.com" },
        { id: "email_address", label: "Primary email address", type: "email", required: true, placeholder: "name@example.com" },
        { id: "legal_business_name", label: "Legal Business Name / Trading Name", type: "text", required: true },
        { id: "business_registration", label: "Australian Company Number (ACN) or EIN", type: "text", helper: "Type N/A if the business does not have either." },
        {
          id: "business_type",
          label: "Business Type",
          type: "select",
          options: [
            { label: "Company", value: "company" },
            { label: "Sole trader", value: "sole-trader" },
            { label: "Partnership", value: "partnership" },
            { label: "Trust", value: "trust" },
            { label: "Nonprofit", value: "nonprofit" },
            { label: "Other", value: "other" },
          ],
        },
        { id: "business_phone", label: "Business Phone Number", type: "tel" },
      ],
    },
    {
      id: "business-address",
      title: "Business address",
      grouped: true,
      fields: [
        { id: "street_address", label: "Business Street Address", type: "text" },
        { id: "city", label: "Business City", type: "text" },
        { id: "state_region", label: "Business State", type: "text", placeholder: "e.g. NSW" },
        { id: "country", label: "Business Country", type: "text" },
        { id: "post_code", label: "Business Post Code / Zip Code", type: "text" },
      ],
    },
    {
      id: "proof-of-address",
      title: "Proof of address",
      description: "To register a phone number on your behalf, proof of business address is required.",
      fields: [
        {
          id: "proof_of_address_link",
          label: "Proof of Address document",
          type: "file",
          helper: "Upload a utility bill, lease agreement, or business registration document — PDF or a clear photo.",
          why: "Your CRM's calls and texts run through regulated phone carriers. Before a carrier will issue a business phone number, it has to verify your business address. It's a one-off compliance check, and we only use it to register your number.",
          accept: ".pdf,.png,.jpg,.jpeg,.webp,.heic",
          placeholder: "https://drive.google.com/...",
        },
      ],
    },
    {
      id: "ideal-customer",
      title: "Ideal customer profile",
      description: "This helps us shape the assistant, ads, follow-up, and conversion strategy.",
      fields: [
        { id: "ideal_customer_profile", label: "Who is your Ideal Customer Profile (ICP)?", type: "textarea", required: true },
        { id: "age_range", label: "What is their age range?", type: "text" },
        {
          id: "gender",
          label: "What is their gender?",
          type: "select",
          options: [
            { label: "All genders", value: "all" },
            { label: "Primarily female", value: "primarily-female" },
            { label: "Primarily male", value: "primarily-male" },
            { label: "Mixed / varies", value: "mixed" },
            { label: "Other / not applicable", value: "other" },
          ],
        },
        { id: "customer_pain_points", label: "What pain points are you trying to solve?", type: "textarea" },
        { id: "why_choose_business", label: "Why should a customer choose your business over a competitor?", type: "textarea" },
      ],
    },
    {
      id: "branding",
      title: "Branding & assets",
      fields: [
        { id: "brand_assets_link", label: "Your logo and brand images", type: "file", helper: "Upload your high-resolution logo (a zip is fine for multiple files), or paste a shared folder link instead.", accept: ".png,.jpg,.jpeg,.webp,.svg,.pdf,.zip", placeholder: "Google Drive, Dropbox, or shared folder link" },
      ],
    },
    {
      id: "lead-sources-access",
      title: "Domain & website access",
      fields: [
        {
          id: "domain_provider_access",
          label: "Domain provider access",
          type: "textarea",
          helper: "Invite admin@allconvos.ai to your domain account (most providers call this delegate, shared or team access), then tell us here who your provider is. If yours doesn't offer that, say so and we'll set it up with you on a quick call. Please don't type passwords here; if you must share one, paste a one-time secret link (for example from onetimesecret.com).",
          placeholder: "Example: GoDaddy — invited admin@allconvos.ai as a delegate",
        },
        {
          id: "website_cms_access",
          label: "Website content management access",
          type: "textarea",
          helper: "Add admin@allconvos.ai as an admin user on your website platform, then tell us here which platform and its login address. If it doesn't let you add a user, say so and we'll set it up with you on a quick call. Please don't type passwords here; if you must share one, paste a one-time secret link (for example from onetimesecret.com).",
          placeholder: "Example: WordPress at yoursite.com/wp-admin — added admin@allconvos.ai as an admin",
        },
        // MUTED per Jesse (2026-07-12) — likely not needed; delete `hidden: true`
        // to bring it back exactly as it was (emails, steps, Scribe guide intact).
        {
          id: "gbp_manager_access",
          label: "Google Business Profile manager access",
          type: "radio",
          hidden: true,
          helper: "You don't need to share any login details. Instead, invite our two team emails as Managers of your Google Business Profile so we can manage it and pull your live Google reviews.",
          inviteEmails: ["projects@richtraining.com.au", "developers@richtraining.com.au"],
          steps: [
            "Log into your Google Business Profile.",
            "Open Business Profile settings → People and access.",
            "Click Add, then choose the Manager role.",
            "Enter both email addresses above and hit Invite.",
          ],
          guideUrl:
            "https://scribehow.com/o/1Ys-2mLjQsuPVjJ-N76Ubg/viewer/How_to_Invite_RT_Digital_to_Manage_Your_Google_Business_Profile__bifUWmdPRpWSk2_UN6uBhA",
          guideLabel: "Step-by-step guide",
          options: [
            { label: "Done — invitations sent", value: "done" },
            { label: "Need help", value: "need-help" },
            { label: "Not applicable", value: "not-applicable" },
          ],
        },
      ],
    },
    {
      id: "terms",
      title: "Terms",
      fields: [
        {
          id: "terms_acceptance",
          label: "Terms & Conditions",
          type: "checkbox",
          required: true,
          helper: "Please read the Program Terms & Conditions below, then accept to finish.",
          document: cmsTermsText,
        },
      ],
    },
  ],
};

// Respond is a single, simpler product — no ad accounts, no domain/website
// takeover, no proof-of-address. Just what the AI receptionist needs to sound
// like the business, plus how to reach them.
export const respondOnboardingForm: PortalFormDefinition = {
  id: "respond-onboarding-intake-v1",
  title: "Respond onboarding intake",
  introTitle: "Complete this once so we can set up your AI receptionist correctly.",
  introDescription: "Please don't type passwords anywhere in this form. Where we need access, invite admin@allconvos.ai instead. If you really must share a password, paste a one-time secret link (for example from onetimesecret.com), never the password itself.",
  sections: [
    {
      id: "business-basics",
      title: "Business basics",
      fields: [
        { id: "legal_business_name", label: "Business name", type: "text", required: true },
        { id: "website_url", label: "Website URL", type: "url", placeholder: "https://example.com" },
        { id: "email_address", label: "Primary email address", type: "email", required: true, placeholder: "name@example.com" },
        { id: "business_phone", label: "Business phone number", type: "tel", required: true },
      ],
    },
    {
      id: "about-customers",
      title: "About your customers",
      description: "This shapes how your AI receptionist talks to callers and qualifies leads.",
      fields: [
        { id: "services_offered", label: "What services or products do you offer?", type: "textarea", required: true },
        { id: "ideal_customer_profile", label: "Who is your ideal customer?", type: "textarea" },
        { id: "qualifying_questions", label: "What should your AI ask a caller to qualify them as a good lead?", type: "textarea", helper: "We'll go through this together on your Welcome Call too — jot down anything you already know." },
      ],
    },
    {
      id: "branding",
      title: "Branding & assets",
      fields: [
        { id: "brand_assets_link", label: "Your logo and brand images (optional)", type: "file", helper: "Upload your logo (a zip is fine for multiple files), or paste a shared folder link instead.", accept: ".png,.jpg,.jpeg,.webp,.svg,.pdf,.zip", placeholder: "Google Drive, Dropbox, or shared folder link" },
      ],
    },
    {
      id: "terms",
      title: "Terms",
      fields: [
        {
          id: "terms_acceptance",
          label: "Terms & Conditions",
          type: "checkbox",
          required: true,
          helper: "Please read the Program Terms & Conditions below, then accept to finish.",
          document: cmsTermsText,
        },
      ],
    },
  ],
};

// BSS custom (Fin Creighton): "Answer a few questions about how you work".
// Spec sections 4.2 and 5 (intake form). One question per screen; every choice
// has a "Not sure yet" way out, so nothing blocks him. The step also offers the
// same questions as a voice interview (products/bss-custom/client-steps.ts).
// Wording drafted by Claude, 2026-10-18: Jesse to approve.
const notSure = { label: "Not sure yet", value: "not-sure" };
export const bssCustomIntakeForm: PortalFormDefinition = {
  id: "bss-custom-intake-v1",
  title: "BSS: how you work",
  introTitle: "A few questions about how you work",
  introDescription: "Short answers are fine. Pick \"Not sure yet\" for anything you don't know: we'll go through it with you. Never put passwords here.",
  sections: [
    {
      id: "reaching-you",
      title: "Reaching you",
      fields: [
        { id: "best_contact", label: "What's the best way and time to reach you?", type: "textarea", placeholder: "e.g. WhatsApp, weekday mornings" },
        { id: "other_approvers", label: "Does anyone else approve things?", type: "text", helper: "Leave it blank if it's just you." },
        { id: "alert_recipients", label: "Who should get alerts for new leads, hot leads and bookings?", type: "textarea", placeholder: "Names, with an email or mobile for each", why: "So the right person hears about a lead within minutes." },
      ],
    },
    {
      id: "how-you-run",
      title: "How you run things today",
      fields: [
        {
          id: "webinar_platform",
          label: "Which platform do you run webinars on?",
          type: "radio",
          why: "So we can send each person a private joining link and see who attended.",
          options: [
            { label: "Zoom Meetings", value: "zoom-meetings" },
            { label: "Zoom Webinars", value: "zoom-webinars" },
            { label: "Something else", value: "other" },
            notSure,
          ],
        },
        {
          id: "payment_method",
          label: "How do you take payment after a sales call?",
          type: "radio",
          why: "So a confirmed payment can start your client onboarding on its own.",
          options: [
            { label: "A Stripe payment link", value: "stripe-link" },
            { label: "An invoice", value: "invoice" },
            { label: "Something else", value: "other" },
            notSure,
          ],
        },
        { id: "payment_detail", label: "Anything else about how payment works?", type: "textarea", helper: "Optional." },
        { id: "partner_setup", label: "How does your partner and commission setup work today?", type: "textarea", why: "So each partner gets credit, from their link through to a paying client." },
        {
          id: "contact_page",
          label: "Should a Contact page be part of the site?",
          type: "radio",
          helper: "It wasn't in the agreement, so Jesse will talk it through with you.",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
            { label: "Let's talk about it", value: "talk" },
          ],
        },
      ],
    },
    {
      id: "audience",
      title: "Your audience",
      fields: [
        {
          id: "contacts_location",
          label: "Where are most of your contacts?",
          type: "radio",
          why: "This decides how your text messages are registered.",
          options: [
            { label: "Australia", value: "au" },
            { label: "The UK", value: "uk" },
            { label: "The US", value: "us" },
            { label: "A mix", value: "mix" },
            notSure,
          ],
        },
        {
          id: "social_accounts",
          label: "Which social accounts should we connect?",
          type: "checkboxes",
          helper: "Tick all that apply.",
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Facebook", value: "facebook" },
            { label: "YouTube", value: "youtube" },
            { label: "X (Twitter)", value: "x" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "TikTok", value: "tiktok" },
            { label: "None for now", value: "none" },
          ],
        },
        { id: "audience_links", label: "Where does your audience find you?", type: "textarea", placeholder: "Paste a link for each place" },
      ],
    },
    {
      id: "team",
      title: "Your team",
      fields: [
        { id: "coaches", label: "Who are your implementation coaches?", type: "textarea", placeholder: "One per line: name, email", why: "Each coach gets their own calendar and CRM login." },
      ],
    },
    {
      id: "voice-goals",
      title: "Your voice and goals",
      fields: [
        { id: "goals", label: "What are your goals for the next 6 months?", type: "textarea", placeholder: "Leads, calls and clients" },
        { id: "tone", label: "Your tone of voice, in three words", type: "text", placeholder: "e.g. calm, direct, warm" },
        { id: "never_say", label: "Anything we should never say or promise?", type: "textarea" },
      ],
    },
  ],
};

// BSS custom: the client's notes on their customer journey map (Jesse,
// 2026-10-18). Never shown as a stepper: the map on "Approve your customer
// journey" saves into it as they type. One box per journey id in
// products/bss-custom/journey-map.ts, plus "also_running" and "anything_else".
export const bssJourneyMapNotesForm: PortalFormDefinition = {
  id: "bss-journey-map-notes-v1",
  title: "BSS: customer journey map notes",
  introTitle: "Your notes on the customer journey",
  introDescription: "Saved as you type on the customer journey map.",
  sections: [
    {
      id: "notes",
      title: "Notes",
      fields: [
        { id: "book_a_call", label: "Book a Clarity Call", type: "textarea" },
        { id: "webinar", label: "Weekly webinar", type: "textarea" },
        { id: "new_clients", label: "New client onboarding", type: "textarea" },
        { id: "also_running", label: "Also running", type: "textarea" },
        { id: "anything_else", label: "Anything else", type: "textarea" },
      ],
    },
  ],
};

/** Honest size label for a form task, computed from the definition so it never
    drifts: "21 questions · about 15 minutes". */
export function formSizeLabel(formId: string): string | null {
  const form = onboardingFormById(formId);
  if (!form) return null;
  const count = form.sections.reduce((n, s) => n + s.fields.filter((f) => !f.hidden).length, 0);
  const minutes = Math.max(5, Math.round((count * 0.7) / 5) * 5);
  return `${count} questions · about ${minutes} minutes`;
}

// AT Network: notes typed on the Scope and Map (products/at-network/scope-map.ts).
export const atNetworkScopeNotesForm: PortalFormDefinition = {
  id: "at-network-scope-notes-v1",
  title: "AT Network: scope and map notes",
  introTitle: "Your notes on the scope and map",
  introDescription: "Saved as you type on the scope and map.",
  sections: [
    {
      id: "notes",
      title: "Notes",
      fields: [
        { id: "website", label: "Track 1: the website build", type: "textarea" },
        { id: "funnel", label: "Track 2: the funnel test", type: "textarea" },
        { id: "phase2", label: "The Phase 2 list", type: "textarea" },
        { id: "also_running", label: "Also running", type: "textarea" },
      ],
    },
  ],
};

export function onboardingFormById(formId: string): PortalFormDefinition | undefined {
  return [scaleOnboardingForm, respondOnboardingForm, bssCustomIntakeForm, bssJourneyMapNotesForm, atNetworkScopeNotesForm].find((form) => form.id === formId);
}

const maxLengths: Partial<Record<PortalFormFieldType, number>> = {
  text: 220,
  email: 180,
  url: 420,
  tel: 60,
  textarea: 2500,
  select: 120,
  radio: 120,
  checkbox: 40,
};

function cleanTextValue(value: unknown, fieldType: PortalFormFieldType) {
  if (typeof value !== "string") return "";
  const maxLength = maxLengths[fieldType] ?? 180;
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanTextareaValue(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLengths.textarea);
}

function optionValues(field: PortalFormField) {
  return new Set((field.options ?? []).map((option) => option.value));
}

function sanitizeFieldValue(field: PortalFormField, value: unknown): PortalFormValue {
  if (field.type === "checkboxes") {
    const allowed = optionValues(field);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter((item) => allowed.has(item))
      : [];
  }
  if (field.type === "checkbox") {
    return value === "accepted" || value === true ? "accepted" : "";
  }
  if (field.type === "textarea") {
    return cleanTextareaValue(value);
  }
  if (field.type === "radio" || field.type === "select") {
    const clean = cleanTextValue(value, field.type);
    return optionValues(field).has(clean) ? clean : "";
  }
  if (field.type === "file") {
    // Either an encoded portal-file token (validated against R2 on download,
    // scoped to the client) or a pasted URL — both plain strings.
    return typeof value === "string" ? value.trim() : "";
  }
  return cleanTextValue(value, field.type);
}

export function formFields(form: PortalFormDefinition): PortalFormField[] {
  return form.sections.flatMap((section) => section.fields).filter((field) => !field.hidden);
}

export function emptyFormResponses(form: PortalFormDefinition): PortalFormResponses {
  return Object.fromEntries(formFields(form).map((field) => [field.id, field.type === "checkboxes" ? [] : ""]));
}

export function sanitizeFormResponses(input: unknown, form: PortalFormDefinition): PortalFormResponses {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const responses = emptyFormResponses(form);
  formFields(form).forEach((field) => {
    responses[field.id] = sanitizeFieldValue(field, source[field.id]);
  });
  return responses;
}

export function formMissingRequired(responses: PortalFormResponses, form: PortalFormDefinition): string[] {
  return formFields(form)
    .filter((field) => field.required)
    .filter((field) => {
      const value = responses[field.id];
      return Array.isArray(value) ? value.length === 0 : !value;
    })
    .map((field) => field.label);
}

/** Renders a raw stored value as display text, e.g. resolving option values to their labels. */
export function formatFieldValue(field: PortalFormField, value: PortalFormValue | undefined): string {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "—";
  }

  const file = decodePortalFileValue(value);
  if (file) {
    return file.fileName;
  }

  const labelFor = (raw: string) => field.options?.find((opt) => opt.value === raw)?.label ?? raw;

  if (field.type === "checkboxes" && Array.isArray(value)) {
    return value.map(labelFor).join(", ");
  }
  if (field.type === "checkbox") {
    return value === "accepted" ? "Yes" : "No";
  }
  if (field.type === "radio" || field.type === "select") {
    return labelFor(value as string);
  }
  return String(value);
}
