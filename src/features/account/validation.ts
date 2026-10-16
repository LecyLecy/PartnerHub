import { z } from "zod";
import { passwordIssue } from "@/lib/form/validators";

/** Registration has its own multi-step wizard (see registration/). This covers the single-screen account forms. */
export type AccountFormMode = "login" | "forgot" | "reset" | "verify";
export function validateAccountForm(mode: AccountFormMode, values: { email: string; password: string; confirm: string; token: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if ((mode === "login" || mode === "forgot" || mode === "verify") && !z.email().safeParse(values.email.trim()).success) errors.email = "Masukkan alamat email yang valid.";
  if (mode === "login" && !values.password) errors.password = "Masukkan password akunmu.";
  if (mode === "reset") {
    const issue = passwordIssue(values.password);
    if (issue) errors.password = issue;
    if (values.confirm !== values.password) errors.confirm = "Konfirmasi password belum cocok.";
    if (!values.token || values.token.length > 2048) errors.token = "Tautan pemulihan tidak valid. Minta tautan baru.";
  }
  return errors;
}
