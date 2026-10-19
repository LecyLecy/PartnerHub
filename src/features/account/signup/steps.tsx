"use client";
import Link from "next/link";
import type { Role } from "@/contracts/account";
import { CheckboxField, FileField, MultiSelect, PasswordField, RadioGroup, SelectField, TextAreaField, TextField } from "@/lib/form/fields";
import { isFreeEmailDomain } from "@/lib/form/validators";
import { budgets, documentLabels, industries, interests, organizerTypes, scales, sponsorCategories } from "./options";
import type { RegistrationFileValues, RegistrationValues, StepKey } from "./schemas";
import styles from "./registration.module.css";

export type StepProps = {
  role: Role;
  values: RegistrationValues;
  files: RegistrationFileValues;
  errors: Record<string, string>;
  busy: boolean;
  set: <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => void;
  setFile: (key: keyof RegistrationFileValues, file: File | null) => void;
};

function AccountStep({ role, values, errors, busy, set }: StepProps) {
  const sponsor = role === "sponsor";
  const workEmail = sponsor && values.email.includes("@") && isFreeEmailDomain(values.email);
  return <>
    <TextField name="fullName" label={sponsor ? "Nama penanggung jawab (PIC)" : role === "organizer" ? "Nama kontak" : "Nama lengkap"} autoComplete="name" value={values.fullName} onChange={(value) => set("fullName", value)} error={errors.fullName} disabled={busy} maxLength={100} />
    {sponsor && <TextField name="position" label="Jabatan PIC" autoComplete="organization-title" value={values.position} onChange={(value) => set("position", value)} error={errors.position} disabled={busy} maxLength={100} />}
    <TextField name="email" label={sponsor ? "Email kerja" : "Email"} type="email" autoComplete="email" inputMode="email" value={values.email} onChange={(value) => set("email", value)} error={errors.email || (workEmail ? "Gunakan email kerja dengan domain perusahaan, bukan email gratis. Admin memakai domain ini untuk memastikan kamu mewakili perusahaan." : undefined)} hint={sponsor ? "Email dengan domain perusahaan membantu admin memverifikasi bahwa kamu mewakili perusahaan." : undefined} disabled={busy} maxLength={254} />
    <TextField name="phone" label="Nomor telepon atau WhatsApp" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(value) => set("phone", value)} error={errors.phone} hint="Nomor Indonesia, misalnya 0812 3456 7890." disabled={busy} maxLength={20} />
    <PasswordField name="password" label="Password" value={values.password} onChange={(value) => set("password", value)} error={errors.password} email={values.email} showStrength hint="Minimal 12 karakter dengan 3 jenis karakter. Password tidak disimpan di perangkat ini." disabled={busy} />
    <PasswordField name="confirm" label="Konfirmasi password" value={values.confirm} onChange={(value) => set("confirm", value)} error={errors.confirm} disabled={busy} />
  </>;
}

function UserProfileStep({ values, errors, busy, set }: StepProps) {
  return <>
    <p className={styles.draftNote}>Langkah ini opsional. Kamu bisa langsung lanjut dan melengkapinya nanti.</p>
    <TextField name="institution" label="Asal institusi" optional value={values.institution} onChange={(value) => set("institution", value)} error={errors.institution} disabled={busy} maxLength={100} autoComplete="organization" />
    <TextField name="city" label="Kota" optional value={values.city} onChange={(value) => set("city", value)} error={errors.city} disabled={busy} maxLength={80} autoComplete="address-level2" />
    <MultiSelect name="interests" label="Jenis acara yang kamu minati" optional value={values.interests} onChange={(value) => set("interests", value)} options={interests} error={errors.interests} disabled={busy} />
  </>;
}

function OrganizerProfileStep({ values, files, errors, busy, set, setFile }: StepProps) {
  const individual = values.organizerType === "individual";
  return <>
    <fieldset className={styles.fieldGroup}><legend>Identitas penyelenggara</legend>
    <RadioGroup name="organizerType" label="Jenis penyelenggara" value={values.organizerType} onChange={(value) => set("organizerType", value)} options={organizerTypes} error={errors.organizerType} disabled={busy} />
    <TextField name="organizationName" label="Nama organisasi, komunitas, atau acara" optional={individual} value={values.organizationName} onChange={(value) => set("organizationName", value)} error={errors.organizationName} hint={individual ? "Boleh dikosongkan bila kamu menyelenggarakan atas nama pribadi." : undefined} disabled={busy} maxLength={100} autoComplete="organization" />
    <TextAreaField name="description" label="Deskripsi singkat penyelenggara" value={values.description} onChange={(value) => set("description", value)} error={errors.description} maxLength={500} disabled={busy} />
    </fieldset>
    <fieldset className={styles.fieldGroup}><legend>Lokasi dan kontak</legend>
    <div className={styles.fieldPair}>
      <TextField name="city" label="Kota atau lokasi" value={values.city} onChange={(value) => set("city", value)} error={errors.city} disabled={busy} maxLength={80} autoComplete="address-level2" />
      <TextField name="address" label="Alamat" value={values.address} onChange={(value) => set("address", value)} error={errors.address} disabled={busy} maxLength={200} autoComplete="street-address" />
    </div>
    <TextField name="position" label="Jabatan atau peranmu" value={values.position} onChange={(value) => set("position", value)} error={errors.position} disabled={busy} maxLength={100} autoComplete="organization-title" />
    <TextField name="website" label="Website" type="url" optional inputMode="url" value={values.website} onChange={(value) => set("website", value)} error={errors.website} disabled={busy} maxLength={200} placeholder="https://" />
    <TextField name="social" label="Media sosial" type="url" optional inputMode="url" value={values.social} onChange={(value) => set("social", value)} error={errors.social} disabled={busy} maxLength={200} placeholder="https://instagram.com/akunmu" />
    </fieldset>
    <fieldset className={styles.fieldGroup}><legend>Logo dan pengalaman</legend>
    <FileField name="logo" label="Logo penyelenggara" kind="logo" optional file={files.logo} onChange={(file) => setFile("logo", file)} error={errors.logo} disabled={busy} />
    <TextAreaField name="experience" label="Pengalaman menyelenggarakan acara" optional value={values.experience} onChange={(value) => set("experience", value)} error={errors.experience} maxLength={500} rows={3} disabled={busy} />
    </fieldset>
  </>;
}

function SponsorCompanyStep({ values, files, errors, busy, set, setFile }: StepProps) {
  return <>
    <fieldset className={styles.fieldGroup}><legend>Profil perusahaan</legend>
    <TextField name="companyName" label="Nama perusahaan atau brand" value={values.companyName} onChange={(value) => set("companyName", value)} error={errors.companyName} disabled={busy} maxLength={100} autoComplete="organization" />
    <SelectField name="industry" label="Bidang industri" value={values.industry} onChange={(value) => set("industry", value)} options={industries} error={errors.industry} disabled={busy} hint="Bidang ini digunakan untuk rekomendasi acara dan tidak dapat diubah setelah registrasi." />
    <SelectField name="scale" label="Skala perusahaan" optional value={values.scale} onChange={(value) => set("scale", value)} options={scales} error={errors.scale} disabled={busy} />
    </fieldset>
    <fieldset className={styles.fieldGroup}><legend>Legalitas perusahaan</legend>
    <TextField name="legalNumber" label="NIB (Nomor Induk Berusaha)" inputMode="numeric" value={values.legalNumber} onChange={(value) => set("legalNumber", value)} error={errors.legalNumber} hint="13 digit angka. Admin memeriksa keasliannya saat verifikasi." disabled={busy} maxLength={20} />
    <TextField name="npwp" label="NPWP perusahaan" optional inputMode="numeric" value={values.npwp} onChange={(value) => set("npwp", value)} error={errors.npwp} hint="15 atau 16 digit angka." disabled={busy} maxLength={24} />
    </fieldset>
    <fieldset className={styles.fieldGroup}><legend>Alamat dan identitas publik</legend>
    <TextField name="address" label="Alamat perusahaan" value={values.address} onChange={(value) => set("address", value)} error={errors.address} disabled={busy} maxLength={200} autoComplete="street-address" />
    <TextField name="city" label="Kota" value={values.city} onChange={(value) => set("city", value)} error={errors.city} disabled={busy} maxLength={80} autoComplete="address-level2" />
    <TextField name="website" label="Website resmi" type="url" inputMode="url" value={values.website} onChange={(value) => set("website", value)} error={errors.website} disabled={busy} maxLength={200} placeholder="https://" />
    <TextField name="social" label="Media sosial resmi" type="url" optional inputMode="url" value={values.social} onChange={(value) => set("social", value)} error={errors.social} disabled={busy} maxLength={200} placeholder="https://linkedin.com/company/namamu" />
    <FileField name="logo" label="Logo perusahaan" kind="logo" file={files.logo} onChange={(file) => setFile("logo", file)} error={errors.logo} disabled={busy} />
    </fieldset>
    <fieldset className={styles.fieldGroup}><legend>Preferensi dukungan</legend>
    <MultiSelect name="categories" label="Kategori sponsorship yang diminati" value={values.categories} onChange={(value) => set("categories", value)} options={sponsorCategories} error={errors.categories} disabled={busy} />
    <SelectField name="budget" label="Kisaran anggaran sponsorship" optional value={values.budget} onChange={(value) => set("budget", value)} options={budgets} error={errors.budget} hint="Hanya untuk membantu penyelenggara menyesuaikan proposal." disabled={busy} />
    </fieldset>
  </>;
}

function DocumentsStep({ role, values, files, errors, busy, setFile }: StepProps) {
  const label = role === "sponsor" ? documentLabels.company : values.organizerType === "individual" ? documentLabels.identity : documentLabels.legal;
  return <>
    <p className={styles.draftNote}>Dokumen hanya dipakai admin untuk verifikasi. Jangan unggah berkas lain. Kami tidak menyimpan berkas ini di browsermu, jadi unggah ulang bila halaman dimuat ulang.</p>
    <FileField name="document" label={label} kind="document" file={files.document} onChange={(file) => setFile("document", file)} error={errors.document} disabled={busy} />
  </>;
}

const typeLabel = (value: string) => organizerTypes.find((item) => item.value === value)?.label ?? value;

function ConfirmStep({ role, values, files, errors, busy, set }: StepProps) {
  const rows: [string, string][] = [["Peran", role === "user" ? "Peserta" : role === "organizer" ? "Penyelenggara" : "Perusahaan sponsor"], ["Nama", values.fullName], ["Email", values.email], ["Telepon", values.phone]];
  if (role === "user") rows.push(["Institusi", values.institution], ["Kota", values.city], ["Minat acara", values.interests.join(", ")]);
  if (role === "organizer") rows.push(["Jenis", typeLabel(values.organizerType)], ["Organisasi", values.organizationName], ["Deskripsi", values.description], ["Kota", values.city], ["Alamat", values.address], ["Jabatan", values.position], ["Website", values.website], ["Media sosial", values.social], ["Pengalaman", values.experience], ["Logo", files.logo?.name ?? ""], ["Dokumen", files.document?.name ?? ""]);
  if (role === "sponsor") rows.push(["Jabatan PIC", values.position], ["Perusahaan", values.companyName], ["Industri", values.industry], ["Skala", scales.find((item) => item.value === values.scale)?.label ?? ""], ["NIB", values.legalNumber], ["NPWP", values.npwp], ["Alamat", values.address], ["Kota", values.city], ["Website", values.website], ["Media sosial", values.social], ["Logo", files.logo?.name ?? ""], ["Kategori", values.categories.join(", ")], ["Anggaran", values.budget], ["Dokumen", files.document?.name ?? ""]);
  return <>
    <dl className={styles.summary}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "-"}</dd></div>)}</dl>
    {role !== "user" && <p className={styles.draftNote}>Akun penyelenggara dan sponsor diperiksa admin sebelum akses penuh dibuka. Kamu akan melihat status verifikasinya setelah masuk.</p>}
    <CheckboxField name="acceptTerms" checked={values.acceptTerms} onChange={(checked) => set("acceptTerms", checked)} error={errors.acceptTerms} disabled={busy}>
      Saya menyetujui <Link href="/terms">Syarat & Ketentuan</Link> dan <Link href="/privacy">Kebijakan Privasi</Link> PartnerHub.
    </CheckboxField>
  </>;
}

export function StepBody(props: StepProps & { step: StepKey }) {
  switch (props.step) {
    case "account": return <AccountStep {...props} />;
    case "profile": return props.role === "user" ? <UserProfileStep {...props} /> : <OrganizerProfileStep {...props} />;
    case "company": return <SponsorCompanyStep {...props} />;
    case "documents": return <DocumentsStep {...props} />;
    case "confirm": return <ConfirmStep {...props} />;
  }
}
