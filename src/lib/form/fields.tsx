"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { passwordStrength } from "./validators";
import { fileRules, fileSize, inspectFile, type FileKind } from "./files";
import styles from "./form.module.css";

type Base = { name: string; label: string; error?: string; hint?: string; optional?: boolean; disabled?: boolean };

function describe(name: string, error?: string, hint?: string) {
  return [hint ? `${name}-hint` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined;
}

function Shell({ name, label, error, hint, optional, children, group = false }: Base & { children: ReactNode; group?: boolean }) {
  const text = <>{label}{optional && <span className={styles.optional}> (opsional)</span>}</>;
  const extras = <>{hint && <p id={`${name}-hint`} className={styles.hint}>{hint}</p>}{error && <p id={`${name}-error`} className={styles.error}>{error}</p>}</>;
  return group
    ? <fieldset className={styles.field} data-field={name} aria-describedby={describe(name, error, hint)}><legend className={styles.label}>{text}</legend>{children}{extras}</fieldset>
    : <div className={styles.field} data-field={name}><label className={styles.label} htmlFor={name}>{text}</label>{children}{extras}</div>;
}

export function TextField({ type = "text", value, onChange, autoComplete, maxLength, placeholder, inputMode, ...base }: Base & { type?: string; value: string; onChange: (value: string) => void; autoComplete?: string; maxLength?: number; placeholder?: string; inputMode?: "text" | "tel" | "email" | "url" | "numeric" }) {
  return <Shell {...base}><input id={base.name} name={base.name} className={styles.input} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={maxLength} placeholder={placeholder} inputMode={inputMode} disabled={base.disabled} aria-invalid={Boolean(base.error)} aria-describedby={describe(base.name, base.error, base.hint)} aria-required={!base.optional} /></Shell>;
}

export function TextAreaField({ value, onChange, maxLength, rows = 4, placeholder, ...base }: Base & { value: string; onChange: (value: string) => void; maxLength: number; rows?: number; placeholder?: string }) {
  const hint = `${base.hint ? `${base.hint} ` : ""}${value.length}/${maxLength} karakter`;
  return <Shell {...base} hint={hint}><textarea id={base.name} name={base.name} className={`${styles.input}`} value={value} rows={rows} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} disabled={base.disabled} aria-invalid={Boolean(base.error)} aria-describedby={describe(base.name, base.error, hint)} aria-required={!base.optional} /></Shell>;
}

export function SelectField({ value, onChange, options, placeholder = "Pilih salah satu", ...base }: Base & { value: string; onChange: (value: string) => void; options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return <Shell {...base}><select id={base.name} name={base.name} className={styles.input} value={value} onChange={(event) => onChange(event.target.value)} disabled={base.disabled} aria-invalid={Boolean(base.error)} aria-describedby={describe(base.name, base.error, base.hint)} aria-required={!base.optional}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Shell>;
}

export function RadioGroup({ value, onChange, options, ...base }: Base & { value: string; onChange: (value: string) => void; options: readonly { value: string; label: string; description?: string }[] }) {
  return <Shell {...base} group><div className={styles.choices}>{options.map((option) => <label key={option.value} className={styles.choice}><input type="radio" name={base.name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} disabled={base.disabled} /><span><strong>{option.label}</strong>{option.description && <><br /><span className={styles.hint}>{option.description}</span></>}</span></label>)}</div></Shell>;
}

export function MultiSelect({ value, onChange, options, ...base }: Base & { value: string[]; onChange: (value: string[]) => void; options: readonly { value: string; label: string }[] }) {
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]);
  return <Shell {...base} group><div className={styles.choices}>{options.map((option) => <label key={option.value} className={styles.choice}><input type="checkbox" value={option.value} checked={value.includes(option.value)} onChange={() => toggle(option.value)} disabled={base.disabled} /><span>{option.label}</span></label>)}</div></Shell>;
}

export function CheckboxField({ checked, onChange, children, ...base }: Omit<Base, "label"> & { label?: string; checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return <div className={styles.field} data-field={base.name}><label className={styles.choice}><input id={base.name} name={base.name} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={base.disabled} aria-invalid={Boolean(base.error)} aria-describedby={base.error ? `${base.name}-error` : undefined} /><span>{children}</span></label>{base.error && <p id={`${base.name}-error`} className={styles.error}>{base.error}</p>}</div>;
}

export function PasswordField({ value, onChange, email = "", showStrength = false, autoComplete = "new-password", ...base }: Base & { value: string; onChange: (value: string) => void; email?: string; showStrength?: boolean; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value, email);
  return <Shell {...base}>
    <div className={styles.passwordWrap}>
      <input id={base.name} name={base.name} className={styles.input} type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={128} disabled={base.disabled} aria-invalid={Boolean(base.error)} aria-describedby={describe(base.name, base.error, base.hint)} aria-required />
      <button type="button" className={styles.toggle} aria-pressed={show} onClick={() => setShow(!show)}>{show ? "Sembunyikan" : "Lihat"}<span className="sr-only"> password</span></button>
    </div>
    {showStrength && <><div className={styles.meter} aria-hidden="true">{[1, 2, 3, 4].map((step) => <span key={step} className={strength.score >= step ? styles.on : ""} />)}</div><p className={styles.hint} role="status">Kekuatan password: {strength.label}</p></>}
  </Shell>;
}

function Preview({ src, alt }: { src: string; alt: string }) {
  // Local blob previews cannot use the Next.js image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} />;
}

/** File picker with image preview for logos, file name and size for documents, plus replace and remove. */
export function FileField({ kind, file, onChange, ...base }: Base & { kind: FileKind; file: File | null; onChange: (file: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const token = useRef(0);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const id = useId();
  useEffect(() => {
    if (!file || kind !== "logo") return;
    const url = URL.createObjectURL(file);
    const timer = setTimeout(() => setPreview(url), 0);
    return () => { clearTimeout(timer); URL.revokeObjectURL(url); setPreview(""); };
  }, [file, kind]);
  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const current = ++token.current;
    setBusy(true); setProblem("");
    const chosen = files[0];
    const result = await inspectFile(chosen, kind).catch(() => "File tidak bisa dibaca. Pilih file yang lain.");
    if (current !== token.current) return;
    setBusy(false);
    if (result) setProblem(result); else onChange(chosen);
  }
  // The newest file check wins over a stale "file required" error from an earlier submit.
  const error = problem || base.error;
  return <Shell {...base} error={error} hint={base.hint ? `${base.hint} ${fileRules[kind].help}` : fileRules[kind].help}>
    <div className={`${styles.upload} ${error ? styles.invalid : ""}`} aria-busy={busy}>
      <div className={styles.thumb}>{preview ? <Preview src={preview} alt={`Pratinjau ${base.label}`} /> : <span aria-hidden="true">{kind === "logo" ? "Logo" : "Berkas"}</span>}</div>
      <div className={styles.fileInfo}>
        <strong>{busy ? "Memeriksa file…" : file ? file.name : "Belum ada file"}</strong>
        <span>{file ? fileSize(file.size) : "Pilih file dari perangkatmu"}</span>
      </div>
      <div className={styles.fileActions}>
        <button type="button" className={styles.small} onClick={() => input.current?.click()} disabled={busy || base.disabled}>{file ? "Ganti file" : "Pilih file"}</button>
        {file && <button type="button" className={styles.small} onClick={() => { token.current++; setProblem(""); setBusy(false); onChange(null); }}>Hapus file</button>}
      </div>
      <input ref={input} id={base.name} name={base.name} className={styles.fileInput} type="file" accept={fileRules[kind].accept} aria-invalid={Boolean(error)} aria-describedby={describe(base.name, error, base.hint || fileRules[kind].help)} aria-labelledby={`${id}-l`} onChange={(event) => { void pick(event.target.files); event.target.value = ""; }} />
      <span id={`${id}-l`} className="sr-only">{base.label}</span>
    </div>
  </Shell>;
}

/** Moves focus to the first field (in the given order) that has an error. */
export function focusFirstError(root: ParentNode | null, order: readonly string[], errors: Record<string, string>) {
  const name = order.find((key) => errors[key]) ?? Object.keys(errors).find((key) => errors[key]);
  if (!name || !root) return;
  requestAnimationFrame(() => {
    const field = root.querySelector<HTMLElement>(`[data-field="${name}"]`);
    const target = field?.querySelector<HTMLElement>("input, select, textarea, button") ?? field;
    target?.focus();
    target?.scrollIntoView({ block: "center", behavior: "auto" });
  });
}
