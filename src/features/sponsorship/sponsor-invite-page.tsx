"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { focusFirstError, SelectField, TextAreaField, TextField } from "@/lib/form/fields";
import { Breadcrumb, EmptyState, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import { getSponsorMatches } from "./services/matching-service";
import { createOffer, getOfferBoard } from "./services/offer-service";
import { supportCategories } from "./categories";
import { SponsorPhoto } from "./sponsor-directory";
import styles from "./matching.module.css";

async function loadInvitation(id: string, signal: AbortSignal) {
  const [sponsors, offers] = await Promise.all([getSponsorMatches(id, signal), getOfferBoard(id, signal)]);
  return { sponsors, offers };
}
export default function SponsorInvitePage({ id }: { id: string }) {
  return <ProtectedPage><Invitation id={id} /></ProtectedPage>;
}
function Invitation({ id }: { id: string }) {
  const sponsorId = useSearchParams().get("sponsorId") ?? "";
  const resource = useResource(id, loadInvitation);
  const back = `/events/${encodeURIComponent(id)}/sponsors`;
  if (resource.status === "loading") return <Loading>Memuat ajakan…</Loading>;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice>;
  if (!resource.data) return null;
  const { sponsors, offers } = resource.data;
  const sponsor = sponsors.items.find(item => item.id === sponsorId);
  const pending = offers.items.some(item => item.sponsorId === sponsorId && item.status === "SENT");
  return <>
    <Breadcrumb href={back} parent="Ajak sponsor" current="Siapkan ajakan" />
    <PageTitle title="Siapkan ajakan sponsor">{sponsors.eventTitle}</PageTitle>
    {!sponsors.eventPublished ? <Notice>Acara harus dipublikasikan sebelum mengirim ajakan. <Link href={back}>Lihat sponsor acara</Link></Notice>
      : !sponsor ? <EmptyState title="Sponsor tidak tersedia" href={back} action="Pilih sponsor">Pilih sponsor terverifikasi sebelum menyiapkan ajakan.</EmptyState>
      : pending ? <Notice>Permintaan untuk {sponsor.companyName} masih menunggu tanggapan. <Link href={back}>Lihat permintaan terkirim</Link></Notice>
      : <div className={styles.invitationLayout}>
        <aside className={styles.selectedSponsor} aria-label="Sponsor pilihan"><SponsorPhoto sponsor={sponsor} /><h2>{sponsor.companyName}</h2><p>{sponsor.industry}</p></aside>
        <InvitationForm key={`${id}:${sponsor.id}`} id={id} sponsorId={sponsor.id} />
      </div>}
  </>;
}
function InvitationForm({ id, sponsorId }: { id: string; sponsorId: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ category: "", message: "", amountLabel: "", proposalUrl: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const order = ["category", "message", "amountLabel", "proposalUrl"];
  const set = (key: keyof typeof values) => (value: string) => { setValues(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: "" })); setFailure(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found: Record<string, string> = {};
    if (!values.category) found.category = "Pilih bentuk dukungan.";
    if (values.message.trim().length < 20) found.message = "Jelaskan permintaanmu, minimal 20 karakter.";
    if (values.proposalUrl.trim() && !/^https:\/\/\S+$/.test(values.proposalUrl.trim())) found.proposalUrl = "Masukkan tautan yang diawali https://.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(form.current, order, found); return; }
    setBusy(true); setFailure("");
    try {
      await createOffer(id, { sponsorId, category: values.category, message: values.message.trim(), amountLabel: values.amountLabel.trim() || null, proposalUrl: values.proposalUrl.trim() || null });
      router.replace(`/events/${encodeURIComponent(id)}/sponsors?sent=1`);
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) { setErrors(error.fields); focusFirstError(form.current, order, error.fields); }
      setBusy(false);
    }
  }
  return <section className={styles.formPanel} aria-labelledby="request-details-title"><h2 id="request-details-title">Detail ajakan</h2>
    <form ref={form} className={uiStyles.form} onSubmit={submit} noValidate>
      <SelectField name="category" label="Bentuk dukungan" value={values.category} onChange={set("category")} options={supportCategories} error={errors.category} disabled={busy} />
      <TextAreaField name="message" label="Pesan untuk sponsor" value={values.message} onChange={set("message")} maxLength={1000} error={errors.message} hint="Jelaskan dukungan dan manfaat yang ditawarkan. Minimal 20 karakter." disabled={busy} />
      <TextField name="amountLabel" label="Nilai dukungan" optional value={values.amountLabel} onChange={set("amountLabel")} maxLength={60} error={errors.amountLabel} disabled={busy} />
      <TextField name="proposalUrl" label="Tautan proposal" optional type="url" inputMode="url" value={values.proposalUrl} onChange={set("proposalUrl")} maxLength={300} error={errors.proposalUrl} hint="Tautan dokumen yang diawali https://." disabled={busy} />
      {failure && <Notice error>{failure}</Notice>}
      <button className={uiStyles.primary} disabled={busy}>{busy ? "Mengirim…" : "Kirim permintaan"}</button>
    </form>
  </section>;
}
