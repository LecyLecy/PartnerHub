"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { eventWhen, listPublicEvents } from "@/lib/public-events";
import { useResource } from "@/lib/use-resource";
import { focusFirstError, SelectField, TextAreaField, TextField } from "@/lib/form/fields";
import { Breadcrumb, EmptyState, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import { createProposal } from "./services/sponsorship-service";
import { supportCategories } from "./categories";
import styles from "./sponsorship.module.css";

export default function NewProposalPage() { return <ProtectedPage><NewProposal /></ProtectedPage>; }

function NewProposal() {
  const router = useRouter();
  const events = useResource("public-events", listPublicEvents);
  const [values, setValues] = useState({ eventId: "", category: "", offer: "", amountLabel: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const set = (key: keyof typeof values) => (value: string) => { setValues((previous) => ({ ...previous, [key]: value })); setErrors((previous) => ({ ...previous, [key]: "" })); setFailure(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found: Record<string, string> = {};
    if (!values.eventId) found.eventId = "Pilih acara yang ingin kamu dukung.";
    if (!values.category) found.category = "Pilih bentuk dukungan.";
    if (values.offer.trim().length < 20) found.offer = "Jelaskan penawaranmu, minimal 20 karakter.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(form.current, ["eventId", "category", "offer", "amountLabel"], found); return; }
    setBusy(true); setFailure("");
    try { await createProposal({ eventId: values.eventId, category: values.category, offer: values.offer.trim(), amountLabel: values.amountLabel.trim() || null }); router.replace("/sponsor?sent=1"); }
    catch (error) { setFailure(errorMessage(error)); if (error instanceof ApiError) { setErrors(error.fields); focusFirstError(form.current, ["eventId", "category", "offer", "amountLabel"], error.fields); } }
    finally { setBusy(false); }
  }
  const selected = events.data?.find((item) => item.id === values.eventId);
  return <div className={styles.proposalForm}>
    <Breadcrumb href="/sponsor" parent="Sponsorship" current="Proposal baru"/>
    <PageTitle title="Kirim proposal sponsorship.">Jelaskan dukungan perusahaanmu. Proposal hanya terlihat oleh perusahaanmu dan penyelenggara acara yang dituju.</PageTitle>
    {events.status === "loading" ? <Loading>Memuat acara…</Loading>
      : events.status === "error" ? <Notice error>{errorMessage(events.error)} <button className={uiStyles.secondary} onClick={events.reload}>Muat ulang</button></Notice>
      : !events.data?.length ? <EmptyState title="Belum ada acara terbuka.">Proposal bisa dikirim setelah penyelenggara mempublikasikan acara.</EmptyState>
      : <form ref={form} className={uiStyles.form} onSubmit={submit} noValidate>
        <SelectField name="eventId" label="Acara" value={values.eventId} onChange={set("eventId")} options={events.data.map((item) => ({ value: item.id, label: `${item.title} (${eventWhen(item.startsAt)})` }))} error={errors.eventId} disabled={busy} />
        {selected && <aside className={styles.eventContext} aria-label="Ringkasan acara pilihan"><strong>{selected.title}</strong><p>{selected.organizationName}</p><p>{eventWhen(selected.startsAt)}{selected.venue ? ` · ${selected.venue}` : ""}</p>{selected.summary && <p>{selected.summary}</p>}</aside>}
        <SelectField name="category" label="Bentuk dukungan" value={values.category} onChange={set("category")} options={supportCategories} error={errors.category} disabled={busy} />
        <TextAreaField name="offer" label="Penawaran" value={values.offer} onChange={set("offer")} error={errors.offer} maxLength={1000} hint="Jelaskan dukungan yang ditawarkan, ruang lingkupnya, dan manfaat yang diharapkan. Minimal 20 karakter." disabled={busy} />
        <TextField name="amountLabel" label="Nilai dukungan" optional value={values.amountLabel} onChange={set("amountLabel")} error={errors.amountLabel} maxLength={60} hint="Misalnya Rp10 juta, atau kosongkan untuk dukungan non-dana." disabled={busy} />
        {failure && <Notice error>{failure}</Notice>}
        <button className={uiStyles.primary} disabled={busy}>{busy ? "Mengirim…" : "Kirim proposal"}</button>
      </form>}
  </div>;
}
