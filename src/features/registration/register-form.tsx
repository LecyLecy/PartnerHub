"use client";
import { useRef, useState, type FormEvent } from "react";
import type { MyRegistration, PublicEvent, RegistrationField, RegistrationForm } from "@/contracts/participation";
import { ApiError, errorMessage } from "@/lib/api-client";
import { focusFirstError, FileField, RadioGroup, TextAreaField, TextField } from "@/lib/form/fields";
import { formatPrice } from "@/lib/money";
import { useResource } from "@/lib/use-resource";
import { Notice, SkeletonCards, uiStyles } from "@/lib/ui";
import { getRegistrationForm, joinEvent, uploadRegistrationImage } from "./services/registration-service";
import styles from "./registration-form.module.css";

const loadForm = (eventId: string, signal: AbortSignal) => getRegistrationForm(eventId, signal);

/** Registration form of one event, as the organizer defined it. Lives inside the event detail dialog. */
export function RegisterForm({ event, onDone }: { event: PublicEvent; onDone: (registration: MyRegistration) => void }) {
  const resource = useResource(event.id, loadForm);
  if (resource.status === "loading") return <SkeletonCards label="Memuat form pendaftaran…" count={1} />;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button type="button" className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice>;
  if (!resource.data) return null;
  return <Form event={event} form={resource.data} onDone={onDone} />;
}

function Form({ event, form, onDone }: { event: PublicEvent; form: RegistrationForm; onDone: (registration: MyRegistration) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const element = useRef<HTMLFormElement>(null);
  const full = event.capacity !== null && event.registeredCount >= event.capacity;
  const name = (field: RegistrationField) => `${event.id}__${field.id}`;
  const clear = (field: RegistrationField) => setErrors((previous) => ({ ...previous, [name(field)]: "" }));
  const order = form.fields.map(name);

  function problems() {
    const found: Record<string, string> = {};
    for (const field of form.fields) {
      const filled = field.type === "image" ? Boolean(files[field.id]) : Boolean(values[field.id]?.trim());
      if (field.required && !filled) found[name(field)] = field.type === "image" ? "Unggah gambar." : field.type === "choice" ? "Pilih salah satu." : "Wajib diisi.";
    }
    return found;
  }

  async function submit(submitted: FormEvent<HTMLFormElement>) {
    submitted.preventDefault();
    if (busy || full) return;
    const found = problems();
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(element.current, order.filter((key) => found[key]), found); return; }
    setBusy(true); setFailure("");
    try {
      const answers: Record<string, string> = {};
      for (const field of form.fields) {
        if (field.type === "image") { const file = files[field.id]; if (file) answers[field.id] = await uploadRegistrationImage(event.id, file, file.name); }
        else if (values[field.id]?.trim()) answers[field.id] = values[field.id].trim();
      }
      onDone(await joinEvent(event.id, answers));
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        const mapped = Object.fromEntries(Object.entries(error.fields).map(([id, text]) => [`${event.id}__${id}`, text]));
        setErrors(mapped);
        focusFirstError(element.current, order, mapped);
      }
    } finally { setBusy(false); }
  }

  return <form ref={element} className={`${uiStyles.form} ${styles.form}`} onSubmit={submit} noValidate aria-label={`Form pendaftaran ${event.title}`}>
    <div className={styles.price}>
      <span>Harga tiket</span>
      <strong data-free={form.priceIdr <= 0}>{formatPrice(form.priceIdr)}</strong>
    </div>
    {form.priceIdr > 0 && form.paymentNote && <Notice><strong>Cara membayar.</strong> {form.paymentNote} Pendaftaran aktif setelah penyelenggara memeriksa bukti pembayaranmu.</Notice>}
    {form.fields.map((field) => {
      const shared = { name: name(field), label: field.label, optional: !field.required, hint: field.hint ?? undefined, error: errors[name(field)] || undefined, disabled: busy };
      if (field.type === "longtext") return <TextAreaField key={field.id} {...shared} maxLength={1000} rows={3} value={values[field.id] ?? ""} onChange={(value) => { setValues({ ...values, [field.id]: value }); clear(field); }} />;
      if (field.type === "choice") return <RadioGroup key={field.id} {...shared} value={values[field.id] ?? ""} onChange={(value) => { setValues({ ...values, [field.id]: value }); clear(field); }} options={field.options.map((option) => ({ value: option, label: option }))} />;
      if (field.type === "image") return <FileField key={field.id} {...shared} kind="logo" thumb="Bukti" help="PNG, JPG, atau WebP. Maks. 2 MB." file={files[field.id] ?? null} onChange={(file) => { setFiles({ ...files, [field.id]: file }); clear(field); }} />;
      return <TextField key={field.id} {...shared} maxLength={200} value={values[field.id] ?? ""} onChange={(value) => { setValues({ ...values, [field.id]: value }); clear(field); }} />;
    })}
    {failure && <Notice error>{failure}</Notice>}
    <button className={uiStyles.primary} disabled={busy || full}>{busy ? "Mendaftar…" : full ? "Penuh" : "Daftar acara"}</button>
  </form>;
}
