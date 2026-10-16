/** Pure validators shared by every form. No framework imports so they stay testable in Node. */

/** Normalizes an Indonesian mobile number to +62 format, or returns null when it is not valid. */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s().-]/g, "");
  let digits: string;
  if (/^\+62\d+$/.test(cleaned)) digits = cleaned.slice(3);
  else if (/^62\d+$/.test(cleaned)) digits = cleaned.slice(2);
  else if (/^0\d+$/.test(cleaned)) digits = cleaned.slice(1);
  else return null;
  return /^8\d{8,11}$/.test(digits) ? `+62${digits}` : null;
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value);
}

const freeDomains = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.id", "ymail.com", "outlook.com", "hotmail.com", "live.com",
  "msn.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "gmx.com", "aol.com", "mail.com",
]);

/** Heuristic only. The list is incomplete, so the server must repeat the company-domain check. */
export function isFreeEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return Boolean(domain && freeDomains.has(domain));
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname.includes("."));
  } catch { return false; }
}

const digitsOnly = (value: string) => value.replace(/[\s.-]/g, "");
/** NIB is a 13 digit business identity number. Format only; authenticity is a backend check. */
export const isNib = (value: string) => /^\d{13}$/.test(digitsOnly(value));
/** NPWP has 15 digits (legacy) or 16 digits (NIK based). Format only. */
export const isNpwp = (value: string) => /^\d{15,16}$/.test(digitsOnly(value));
export const stripFormatting = digitsOnly;

const commonPasswords = ["password", "qwerty", "123456", "12345678", "iloveyou", "letmein", "admin", "welcome", "partnerhub"];

function classes(password: string): number {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
}

/** First blocking problem for a new password, or null when acceptable. */
export function passwordIssue(password: string, email = ""): string | null {
  if (password.length < 12) return "Gunakan minimal 12 karakter.";
  if (password.length > 128) return "Password maksimal 128 karakter.";
  if (classes(password) < 3) return "Campurkan minimal 3 jenis: huruf besar, huruf kecil, angka, simbol.";
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && password.toLowerCase().includes(local)) return "Password tidak boleh memuat bagian depan emailmu.";
  if (commonPasswords.some((word) => password.toLowerCase().includes(word))) return "Password terlalu umum. Pilih kombinasi yang tidak mudah ditebak.";
  return null;
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };
const labels = ["Terlalu lemah", "Lemah", "Cukup", "Baik", "Kuat"] as const;

export function passwordStrength(password: string, email = ""): Strength {
  if (!password) return { score: 0, label: labels[0] };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (classes(password) >= 3) score++;
  if (password.length >= 16 && classes(password) >= 3) score++;
  if (passwordIssue(password, email) && score > 1) score = 1;
  const capped = Math.min(score, 4) as Strength["score"];
  return { score: capped, label: labels[capped] };
}
