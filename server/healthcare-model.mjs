// MUKTalent Healthcare · shared constants and validation (server side).
import { z } from "zod";

export const BUCKET = "healthcare-docs";
export const MAX_BYTES = 10 * 1024 * 1024;
export const MIME = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
};

export const PROFESSIONS = [
  "registered_nurse", "adult_nurse", "mental_health_nurse", "learning_disability_nurse",
  "physiotherapist", "occupational_therapist", "radiographer", "biomedical_scientist", "pharmacist",
  "other_ahp", "healthcare_support_worker", "social_care_professional", "other"
];

export const PROFESSION_LABELS = {
  registered_nurse: "Registered Nurse", adult_nurse: "Adult Nurse", mental_health_nurse: "Mental Health Nurse",
  learning_disability_nurse: "Learning Disability Nurse", physiotherapist: "Physiotherapist",
  occupational_therapist: "Occupational Therapist", radiographer: "Radiographer", biomedical_scientist: "Biomedical Scientist",
  pharmacist: "Pharmacist", other_ahp: "Other Allied Health Professional", healthcare_support_worker: "Healthcare Support Worker",
  social_care_professional: "Social Care Professional", other: "Other healthcare role"
};

// Internal pipeline (section 13 of the brief) in order.
export const STAGES = [
  "new_registration", "initial_review", "awaiting_information", "documentation_review", "professional_verification",
  "suitable_for_matching", "submitted_to_employer", "interview_scheduled", "interview_completed", "offer_received",
  "offer_accepted", "pre_employment_checks", "recruitment_completed", "unsuccessful", "withdrawn"
];
export const STAGE_LABELS = {
  new_registration: "New Registration", initial_review: "Initial Review", awaiting_information: "Awaiting Information",
  documentation_review: "Documentation Review", professional_verification: "Professional Verification",
  suitable_for_matching: "Suitable for Matching", submitted_to_employer: "Submitted to Employer",
  interview_scheduled: "Interview Scheduled", interview_completed: "Interview Completed", offer_received: "Offer Received",
  offer_accepted: "Offer Accepted", pre_employment_checks: "Pre-employment Checks", recruitment_completed: "Recruitment Completed",
  unsuccessful: "Unsuccessful", withdrawn: "Withdrawn"
};
// Stages that amount to active recruitment / matching with an employer.
export const MATCHING_STAGES = new Set(STAGES.slice(STAGES.indexOf("suitable_for_matching"), STAGES.indexOf("recruitment_completed") + 1));
export const CLOSED_STAGES = new Set(["recruitment_completed", "unsuccessful", "withdrawn"]);

// Candidate-facing journey (section 8): 8 public steps mapped from the internal pipeline.
export const JOURNEY = [
  ["registration", ["new_registration"]],
  ["assessment", ["initial_review", "awaiting_information"]],
  ["verification", ["documentation_review", "professional_verification"]],
  ["matching", ["suitable_for_matching", "submitted_to_employer"]],
  ["interviews", ["interview_scheduled", "interview_completed"]],
  ["offer", ["offer_received", "offer_accepted"]],
  ["pre_employment", ["pre_employment_checks"]],
  ["pre_departure", ["recruitment_completed"]]
];
export function journeyIndex(stage) {
  const i = JOURNEY.findIndex(([, stages]) => stages.includes(stage));
  return i < 0 ? 0 : i;
}

export const DOC_KINDS = ["cv", "passport", "qualification", "registration", "english_test", "reference", "right_to_work", "other"];
export const REG_STATUS = ["registered_uk", "in_progress_uk", "registered_home", "not_started", "not_applicable"];
export const ENGLISH = ["ielts_oet_passed", "test_booked", "preparing", "native_or_exempt", "not_sure"];
export const EMPLOYMENT = ["employed", "self_employed", "unemployed", "studying", "other"];
export const ORG_TYPES = ["nhs_trust", "independent_hospital", "care_home", "home_care", "gp_practice", "clinic", "local_authority", "other"];
export const LANGS = ["en", "es", "ar", "fr"];

const clean = s => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
export const text = (max, min = 0) => z.preprocess(v => clean(v), z.string().min(min).max(max));
export const optText = max => z.preprocess(v => { const c = clean(v); return c ? c : null; }, z.string().max(max).nullable());
export const email = z.preprocess(v => clean(v).toLowerCase(), z.string().max(320).email());
export const phone = z.preprocess(v => { const c = clean(v); return c ? c : null; }, z.string().max(40).regex(/^[+0-9 ()\-.]{6,40}$/).nullable());
export const iso = z.preprocess(v => clean(v).toUpperCase(), z.string().regex(/^[A-Z]{2}$/));
export const optIso = z.preprocess(v => { const c = clean(v).toUpperCase(); return c ? c : null; }, z.string().regex(/^[A-Z]{2}$/).nullable());
const bool = z.preprocess(v => v === true || v === "true" || v === "on" || v === 1 || v === "1", z.boolean());

export const fileMeta = z.object({
  name: text(200, 1),
  type: z.enum(Object.keys(MIME)),
  size: z.number().int().min(1).max(MAX_BYTES)
});

export const candidateFields = {
  full_name: text(140, 2),
  phone,
  country_residence: iso,
  nationality: optIso,
  profession: z.enum(PROFESSIONS),
  experience_years: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(60).nullable()),
  registration_status: z.enum(REG_STATUS),
  registration_body: optText(120),
  registration_number: optText(60),
  english_level: z.enum(ENGLISH).nullable().optional(),
  employment_status: z.enum(EMPLOYMENT).nullable().optional(),
  preferred_location: optText(120),
  right_to_work_uk: bool.optional(),
  additional_info: optText(3000)
};

export const registrationSchema = z.object({
  ...candidateFields,
  email,
  privacy: z.literal(true, { message: "Please confirm you have read the Candidate Privacy Notice." }),
  marketing: bool.optional(),
  cv: fileMeta.nullable().optional(),
  vacancy: z.string().regex(/^[a-z0-9][a-z0-9-]{2,90}$/).nullable().optional(),
  lang: z.enum(LANGS).optional(),
  website: z.string().max(0).optional(), // honeypot
  elapsed: z.number().int().min(0).optional()
});

export const profileUpdateSchema = z.object({
  phone: candidateFields.phone.optional(),
  country_residence: candidateFields.country_residence.optional(),
  nationality: candidateFields.nationality.optional(),
  experience_years: candidateFields.experience_years.optional(),
  registration_status: candidateFields.registration_status.optional(),
  registration_body: candidateFields.registration_body.optional(),
  registration_number: candidateFields.registration_number.optional(),
  english_level: candidateFields.english_level,
  employment_status: candidateFields.employment_status,
  preferred_location: candidateFields.preferred_location.optional(),
  additional_info: candidateFields.additional_info.optional(),
  marketing_consent: bool.optional(),
  preferred_language: z.enum(LANGS).optional()
}).strict();

export const enquirySchema = z.object({
  route: z.enum(["candidate", "employer", "general"]),
  name: text(140, 2),
  email,
  phone,
  organisation: optText(160),
  job_title: optText(120),
  subject: optText(200),
  message: optText(4000),
  organisation_type: z.enum(ORG_TYPES).nullable().optional(),
  location: optText(160),
  professions: z.array(z.enum(PROFESSIONS)).max(13).optional(),
  vacancies_count: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(5000).nullable()).optional(),
  requirements: optText(4000).optional(),
  privacy: z.literal(true, { message: "Please confirm you have read the privacy information." }),
  marketing: bool.optional(),
  lang: z.enum(LANGS).optional(),
  website: z.string().max(0).optional(),
  elapsed: z.number().int().min(0).optional()
}).superRefine((v, ctx) => {
  if (v.route === "employer") {
    if (!v.organisation) ctx.addIssue({ code: "custom", path: ["organisation"], message: "Organisation name is required." });
    if (!v.organisation_type) ctx.addIssue({ code: "custom", path: ["organisation_type"], message: "Organisation type is required." });
    if (!v.professions?.length) ctx.addIssue({ code: "custom", path: ["professions"], message: "Select at least one profession." });
    if (/@(gmail|yahoo|hotmail|outlook|icloud|aol|proton|gmx)\./i.test(v.email)) ctx.addIssue({ code: "custom", path: ["email"], message: "Please use your business email address." });
  } else if (!v.message || v.message.length < 10) {
    ctx.addIssue({ code: "custom", path: ["message"], message: "Please write a short message (at least 10 characters)." });
  }
});

export const complaintSchema = z.object({
  complainant_name: text(140, 2),
  email,
  phone,
  complainant_role: z.enum(["candidate", "employer", "employee", "other"]),
  candidate_reference: optText(40),
  category: z.enum(["recruitment_process", "fees", "information", "discrimination", "data_protection", "staff_conduct", "employer", "other"]),
  subject: text(200, 3),
  details: text(6000, 10),
  privacy: z.literal(true, { message: "Please confirm you have read the privacy information." }),
  lang: z.enum(LANGS).optional(),
  website: z.string().max(0).optional(),
  elapsed: z.number().int().min(0).optional()
});

export const vacancySchema = z.object({
  title: text(160, 3),
  employer_id: z.string().uuid().nullable().optional(),
  employer_display: text(160, 2),
  profession: z.enum(PROFESSIONS),
  location: text(160, 2),
  salary_min: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(1000000).nullable()),
  salary_max: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(1000000).nullable()),
  salary_text: optText(160),
  contract_type: z.enum(["permanent", "fixed_term", "bank", "part_time", "other"]),
  working_hours: text(160, 2),
  qualifications: text(4000, 2),
  registration_requirements: text(2000, 2),
  description: text(8000, 20),
  conditions: text(4000, 2),
  visa_sponsorship: z.enum(["available", "not_available", "not_stated"]).default("not_stated"),
  closes_on: z.preprocess(v => (v ? v : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  consultant_id: z.string().uuid().nullable().optional()
}).refine(v => v.salary_max == null || v.salary_min == null || v.salary_max >= v.salary_min, { message: "Maximum salary must be greater than the minimum.", path: ["salary_max"] });

export const employerSchema = z.object({
  organisation_name: text(160, 2),
  organisation_type: z.enum(ORG_TYPES),
  contact_name: optText(140),
  job_title: optText(120),
  email: z.preprocess(v => { const c = clean(v).toLowerCase(); return c ? c : null; }, z.string().email().max(320).nullable()),
  phone,
  location: optText(160),
  cqc_provider_id: optText(40),
  sponsor_licence: z.boolean().nullable().optional(),
  status: z.enum(["prospect", "due_diligence", "active", "paused", "closed"]).optional(),
  due_diligence_status: z.enum(["not_started", "in_progress", "completed", "failed"]).optional(),
  due_diligence_notes: optText(4000),
  terms_signed_at: z.preprocess(v => (v ? v : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()).optional(),
  owner_id: z.string().uuid().nullable().optional(),
  notes: optText(4000)
});

export function slugify(title) {
  const base = String(title).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "vacancy";
  return base.length < 3 ? base + "-role" : base;
}

// Decide what the Code of Practice allows for a country of residence.
export function countryDecision(rule) {
  if (!rule) return { status: "green", activeRecruitment: true };
  if (rule.status === "red") return { status: "red", activeRecruitment: false };
  if (rule.status === "amber") return { status: "amber", activeRecruitment: false, note: rule.agreement_note || null };
  return { status: "green", activeRecruitment: true };
}

// Can the pipeline move to `next` for a candidate with this country status?
export function stageAllowed(candidate, next, { actorRole, note } = {}) {
  if (!STAGES.includes(next)) return "Unknown stage.";
  if (MATCHING_STAGES.has(next)) {
    if (candidate.country_status === "unchecked") return "Run the country-of-residence check before matching this candidate.";
    if (candidate.country_status === "red") return "Country of residence is on the Code of Practice red list: no active recruitment. Signpost the candidate to direct-application routes instead.";
    if (candidate.country_status === "amber") {
      if (actorRole !== "admin") return "Amber-list country: only an administrator can confirm recruitment under the government-to-government agreement.";
      if (!note || note.length < 15) return "Amber-list country: record how this recruitment complies with the government-to-government agreement.";
    }
  }
  return null;
}
