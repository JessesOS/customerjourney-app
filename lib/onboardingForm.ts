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
  introDescription: "For passwords, use your approved secure handoff method or paste a secure one-time link instead of raw credentials.",
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
          helper: "Share the provider URL and username. For passwords, use your approved secure handoff method or paste a secure one-time link.",
          placeholder: "Example: GoDaddy URL, username, secure handoff link",
        },
        {
          id: "website_cms_access",
          label: "Website content management access",
          type: "textarea",
          helper: "Share the CMS URL and username. For passwords, use your approved secure handoff method or paste a secure one-time link.",
          placeholder: "Example: WordPress URL, username, secure handoff link",
        },
        // MUTED per Jesse (2026-07-12) — likely not needed; delete `hidden: true`
        // to bring it back exactly as it was (emails, steps, Scribe guide intact).
        {
          id: "gbp_manager_access",
          label: "Google Business Profile manager access",
          type: "radio",
          hidden: true,
          helper: "You don't need to share any login details. Instead, invite our two RT Digital emails as Managers of your Google Business Profile so we can manage it and pull your live Google reviews.",
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
          helper: "Please read the RT Digital Program Terms & Conditions below, then accept to finish.",
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
  introDescription: "For passwords, use your approved secure handoff method or paste a secure one-time link instead of raw credentials.",
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
          helper: "Please read the RT Digital Program Terms & Conditions below, then accept to finish.",
          document: cmsTermsText,
        },
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

export function onboardingFormById(formId: string): PortalFormDefinition | undefined {
  return [scaleOnboardingForm, respondOnboardingForm].find((form) => form.id === formId);
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
