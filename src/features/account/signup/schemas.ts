import { z } from "zod";
import type { Role } from "@/contracts/account";
import { industries, interests, sponsorCategories, budgets } from "./options";
import { isEmail, isFreeEmailDomain, isHttpUrl, isNib, isNpwp, normalizePhone, passwordIssue } from "@/lib/form/validators";

/** Single flat value bag shared by every role so shared fields survive a role switch. */
export type RegistrationValues = {
  fullName: string; email: string; phone: string; password: string; confirm: string; acceptTerms: boolean;
  institution: string; city: string; interests: string[];
  organizerType: string; organizationName: string; description: string; address: string; position: string; website: string; social: string; experience: string;
  companyName: string; industry: string; scale: string; legalNumber: string; npwp: string; categories: string[]; budget: string;
};
export type RegistrationFileValues = { logo: File | null; document: File | null };

export const emptyValues: RegistrationValues = {
  fullName: "", email: "", phone: "", password: "", confirm: "", acceptTerms: false,
  institution: "", city: "", interests: [],
  organizerType: "", organizationName: "", description: "", address: "", position: "", website: "", social: "", experience: "",
  companyName: "", industry: "", scale: "", legalNumber: "", npwp: "", categories: [], budget: "",
};
export const emptyFiles: RegistrationFileValues = { logo: null, document: null };

export type StepKey = "account" | "profile" | "company" | "documents" | "confirm";
export const stepLabels: Record<StepKey, string> = { account: "Akun", profile: "Profil", company: "Perusahaan", documents: "Dokumen", confirm: "Konfirmasi" };

/** Step order per role. The user path is intentionally short. */
export const stepsFor: Record<Role, readonly StepKey[]> = {
  user: ["account", "profile", "confirm"],
  organizer: ["account", "profile", "documents", "confirm"],
  sponsor: ["account", "company", "documents", "confirm"],
};

/** Field order for focusing the first error, per step. */
export const fieldOrder: Record<StepKey, Record<Role, readonly string[]>> = {
  account: {
    user: ["fullName", "email", "phone", "password", "confirm"],
    organizer: ["fullName", "email", "phone", "password", "confirm"],
    sponsor: ["fullName", "position", "email", "phone", "password", "confirm"],
  },
  profile: { user: ["institution", "city", "interests"], organizer: ["organizerType", "organizationName", "description", "city", "address", "position", "website", "social", "logo", "experience"], sponsor: [] },
  company: { user: [], organizer: [], sponsor: ["companyName", "industry", "scale", "legalNumber", "npwp", "address", "city", "website", "social", "logo", "categories", "budget"] },
  documents: { user: [], organizer: ["document"], sponsor: ["document"] },
  confirm: { user: ["acceptTerms"], organizer: ["acceptTerms"], sponsor: ["acceptTerms"] },
};

const trim = (value: string) => value.trim();
const required = (message: string, max = 200) => z.string().transform(trim).pipe(z.string().min(1, message).max(max, `Maksimal ${max} karakter.`));
const optional = (max: number) => z.string().transform(trim).pipe(z.string().max(max, `Maksimal ${max} karakter.`));
const url = (optionalUrl: boolean) => z.string().transform(trim).pipe(z.string().max(200, "Maksimal 200 karakter.").refine((value) => (optionalUrl && !value) || isHttpUrl(value), "Tulis tautan lengkap, misalnya https://contoh.id."));

const accountShape = {
  fullName: required("Isi nama lengkap.", 100),
  email: z.string().transform(trim).pipe(z.string().refine(isEmail, "Masukkan alamat email yang valid.")),
  phone: z.string().refine((value) => normalizePhone(value) !== null, "Gunakan nomor Indonesia, misalnya 0812 3456 7890 atau +62 812 3456 7890."),
  password: z.string(),
  confirm: z.string(),
};

function checkPassword(values: { email: string; password: string; confirm: string }, context: z.RefinementCtx) {
  const issue = passwordIssue(values.password, values.email);
  if (issue) context.addIssue({ code: "custom", path: ["password"], message: issue });
  if (values.confirm !== values.password) context.addIssue({ code: "custom", path: ["confirm"], message: "Konfirmasi password belum cocok." });
}

const accountStep = (role: Role) => z.object({
  ...accountShape,
  ...(role === "sponsor" ? { position: required("Isi jabatan penanggung jawab.", 100) } : {}),
}).superRefine((values, context) => {
  checkPassword(values, context);
  if (role === "sponsor" && isFreeEmailDomain(values.email)) context.addIssue({ code: "custom", path: ["email"], message: "Gunakan email kerja dengan domain perusahaan, bukan email gratis. Admin memakai domain ini untuk memastikan kamu mewakili perusahaan." });
});

const userProfile = z.object({
  institution: optional(100), city: optional(80),
  interests: z.array(z.enum(interests.map((item) => item.value) as [string, ...string[]])).max(10),
});

const organizerProfile = z.object({
  organizerType: z.enum(["individual", "organization", "community", "institution"], { error: "Pilih jenis penyelenggara." }),
  organizationName: optional(100),
  description: required("Tulis deskripsi singkat penyelenggara.", 500).pipe(z.string().min(20, "Tulis minimal 20 karakter agar admin memahami penyelenggaramu.")),
  city: required("Isi kota atau lokasi.", 80),
  address: required("Isi alamat.", 200),
  position: required("Isi jabatan atau peranmu.", 100),
  website: url(true), social: url(true),
  experience: optional(500),
}).superRefine((values, context) => {
  if (values.organizerType !== "individual" && !values.organizationName) context.addIssue({ code: "custom", path: ["organizationName"], message: "Isi nama organisasi, komunitas, atau institusi." });
});

const sponsorCompany = z.object({
  companyName: required("Isi nama perusahaan atau brand.", 100),
  industry: z.enum(industries.map((item) => item.value) as [string, ...string[]], { error: "Pilih bidang industri." }),
  scale: z.string().refine((value) => ["", "startup", "umkm", "corporate"].includes(value), "Pilihan skala tidak dikenal."),
  legalNumber: z.string().refine(isNib, "NIB terdiri dari 13 digit angka."),
  npwp: z.string().refine((value) => !value.trim() || isNpwp(value), "NPWP terdiri dari 15 atau 16 digit angka."),
  address: required("Isi alamat perusahaan.", 200),
  city: required("Isi kota.", 80),
  website: url(false), social: url(true),
  categories: z.array(z.enum(sponsorCategories.map((item) => item.value) as [string, ...string[]])).min(1, "Pilih minimal satu kategori sponsorship."),
  budget: z.string().refine((value) => !value || budgets.some((item) => item.value === value), "Pilihan budget tidak dikenal."),
});

const confirmStep = z.object({ acceptTerms: z.boolean().refine((value) => value, "Setujui Syarat & Ketentuan dan Kebijakan Privasi untuk melanjutkan.") });

export function schemaFor(role: Role, step: StepKey): z.ZodType | null {
  if (step === "account") return accountStep(role);
  if (step === "confirm") return confirmStep;
  if (step === "profile") return role === "user" ? userProfile : role === "organizer" ? organizerProfile : null;
  if (step === "company") return role === "sponsor" ? sponsorCompany : null;
  return null;
}

/** Validates one step. Returns a map of field name to message. */
export function validateStep(role: Role, step: StepKey, values: RegistrationValues, files: RegistrationFileValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const schema = schemaFor(role, step);
  if (schema) {
    const result = schema.safeParse(values);
    if (!result.success) for (const issue of result.error.issues) { const key = String(issue.path[0] ?? ""); if (key && !errors[key]) errors[key] = issue.message; }
  }
  if (step === "documents" && !files.document) errors.document = role === "organizer" ? "Unggah dokumen verifikasi agar admin dapat memeriksa penyelenggaramu." : "Unggah dokumen legalitas perusahaan.";
  if (step === "company" && !files.logo) errors.logo = "Unggah logo perusahaan.";
  return errors;
}

export function validateAll(role: Role, values: RegistrationValues, files: RegistrationFileValues): { step: StepKey; errors: Record<string, string> } | null {
  for (const step of stepsFor[role]) {
    const errors = validateStep(role, step, values, files);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}

/** Fields that belong only to a role. They are cleared when the person switches away from that role. */
const roleOnly: Record<Role, readonly (keyof RegistrationValues)[]> = {
  user: ["institution", "interests"],
  organizer: ["organizerType", "organizationName", "description", "address", "experience"],
  sponsor: ["companyName", "industry", "scale", "legalNumber", "npwp", "categories", "budget", "address"],
};

/** Switching roles keeps shared fields (name, email, phone, city, website, social, position, logo) and drops role-only ones. */
export function switchRole(values: RegistrationValues, files: RegistrationFileValues, from: Role, to: Role): { values: RegistrationValues; files: RegistrationFileValues } {
  if (from === to) return { values, files };
  const next = { ...values };
  const keep = new Set(roleOnly[to]);
  for (const key of roleOnly[from]) if (!keep.has(key)) (next as Record<string, unknown>)[key] = emptyValues[key];
  // A document for one role is not valid proof for another, and organizer/sponsor logos mean different things.
  return { values: next, files: { logo: files.logo, document: null } };
}
