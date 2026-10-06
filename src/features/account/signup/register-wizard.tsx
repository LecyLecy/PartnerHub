"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Role } from "@/contracts/account";
import { ApiError, errorMessage } from "@/lib/api-client";
import { destinationAfterAuth, safeDestination } from "@/lib/navigation";
import { useSession } from "@/lib/session";
import { Notice, uiStyles } from "@/lib/ui";
import { focusFirstError } from "@/lib/form/fields";
import { Stepper } from "@/lib/form/stepper";
import { registerOrganizer, registerSponsor, registerUser } from "../services/account-service";
import { buildOrganizer, buildSponsor, buildUser } from "./payload";
import RolePicker from "./role-picker";
import { fieldOrder, stepLabels, stepsFor, validateAll, validateStep } from "./schemas";
import { StepBody } from "./steps";
import { useRegistration } from "./use-registration";
import { roles } from "./options";
import styles from "./registration.module.css";

const isRole = (value: string | null): value is Role => value === "user" || value === "organizer" || value === "sponsor";

export default function RegisterWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const auth = useSession();
  const preset = search.get("role");
  const next = safeDestination(search.get("next"));
  const { state, ready, pickRole, clearRole, setValue, setFile, setErrors, goTo, clearDraft } = useRegistration(isRole(preset) ? preset : null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  if (!ready) return <div className="route-state" role="status">Menyiapkan formulir…</div>;
  if (!state.role) return <RolePicker onPick={pickRole} next={next} />;

  const role = state.role;
  const steps = stepsFor[role];
  const infos = steps.map((key) => ({ key, label: stepLabels[key] }));
  const step = steps[state.step];
  const last = state.step === steps.length - 1;

  function showErrors(target: number, errors: Record<string, string>) {
    goTo(target);
    setErrors(errors);
    const key = steps[target];
    setTimeout(() => focusFirstError(form.current, fieldOrder[key][role], errors), 0);
  }

  function move(target: number) {
    goTo(target, true);
    setFailure("");
    setTimeout(() => title.current?.focus(), 0);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setFailure("");
    const errors = validateStep(role, step, state.values, state.files);
    if (Object.keys(errors).length) { showErrors(state.step, errors); return; }
    if (!last) { move(state.step + 1); return; }
    const problem = validateAll(role, state.values, state.files);
    if (problem) { showErrors(steps.indexOf(problem.step), problem.errors); return; }
    setBusy(true);
    try {
      const files = { logo: state.files.logo, document: state.files.document };
      const result = role === "user" ? await registerUser(buildUser(state.values))
        : role === "organizer" ? await registerOrganizer(buildOrganizer(state.values), files)
        : await registerSponsor(buildSponsor(state.values), files);
      clearDraft();
      if (result.verificationRequired || !result.session) {
        router.replace(`/verify-email?registered=${role}&next=${encodeURIComponent(next)}`);
      } else {
        auth.accept(result.session);
        router.replace(destinationAfterAuth(result.session, next));
      }
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        const key = Object.keys(error.fields)[0];
        const target = steps.findIndex((item) => fieldOrder[item][role].includes(key));
        showErrors(target >= 0 ? target : 0, error.fields);
      }
    } finally { setBusy(false); }
  }

  return <section className={styles.formWrap} aria-labelledby="register-form-title">
    <div className={styles.roleBar} role="group" aria-label="Peran akun">
      <p className={styles.roleLabel}>Pilih peran akun</p>
      <div className={styles.roleChoices}>
      {roles.map((item) => <button key={item.value} type="button" className={styles.roleButton} aria-pressed={role === item.value} onClick={() => pickRole(item.value)} disabled={busy}>{item.title}</button>)}
      </div>
      <p className={styles.roleHelp}>Mengganti peran mengosongkan detail khusus peran dan file, bukan data akun.</p>
    </div>
    {state.switched && <p className={styles.roleFeedback} role="status">Peran diperbarui. Periksa detail sebelum melanjutkan.</p>}
    <Stepper steps={infos} current={state.step} reached={state.reached} onGo={(index) => { goTo(index); setFailure(""); }} />
    <h1 id="register-form-title" ref={title} tabIndex={-1}>{step === "account" ? "Buat akunmu" : step === "profile" ? (role === "user" ? "Lengkapi profil" : "Profil penyelenggara") : step === "company" ? "Profil perusahaan" : step === "documents" ? "Dokumen verifikasi" : "Periksa dan konfirmasi"}</h1>
    <form ref={form} onSubmit={submit} noValidate>
      <div className={styles.stepBody}>
        <StepBody step={step} role={role} values={state.values} files={state.files} errors={state.errors} busy={busy} set={setValue} setFile={setFile} />
      </div>
      {failure && <Notice error>{failure}</Notice>}
      <div className={styles.actions}>
        {state.step > 0 ? <button type="button" className={styles.back} onClick={() => { goTo(state.step - 1); setFailure(""); }} disabled={busy}>Kembali</button> : <button type="button" className={styles.back} onClick={clearRole} disabled={busy}>Ubah peran</button>}
        <button type="submit" className={uiStyles.primary} disabled={busy}>{busy ? "Mengirim…" : last ? "Buat akun" : "Lanjutkan"}</button>
      </div>
      <p className={styles.draftNote}>Isianmu disimpan sementara di tab ini bila halaman dimuat ulang. Password dan file tidak disimpan.</p>
    </form>
  </section>;
}
