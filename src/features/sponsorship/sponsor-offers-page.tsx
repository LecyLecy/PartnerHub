"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { focusFirstError, SelectField, TextAreaField, TextField } from "@/lib/form/fields";
import { Badge, Breadcrumb, EmptyState, Loading, Notice, PageTitle, ProtectedPage, uiStyles } from "@/lib/ui";
import type { SponsorOfferBoard } from "@/contracts/sponsor-offer";
import { supportCategories } from "./categories";
import { offerLabel, offerTone } from "./offer-status";
import { createOffer, getOfferBoard, listSponsorDirectory } from "./services/offer-service";
import styles from "./sponsorship.module.css";

export default function SponsorOffersPage({ id }: { id: string }) { return <ProtectedPage><Offers id={id} /></ProtectedPage>; }

function Offers({ id }: { id: string }) {
  const board = useResource(id, getOfferBoard);
  // Kept here because reload() swaps the page for a loading state, which would drop a message held in the form.
  const [sent, setSent] = useState(false);
  if (board.status === "loading") return <Loading>Memuat permintaan sponsor…</Loading>;
  if (board.status === "error") return <Notice error>{errorMessage(board.error)} <button className={uiStyles.secondary} onClick={board.reload}>Coba lagi</button> <Link href="/organizer">Ke workspace</Link></Notice>;
  if (!board.data) return null;
  return <Loaded id={id} data={board.data} sent={sent} onSent={() => { setSent(true); board.reload(); }} onEdit={() => setSent(false)} />;
}

function Loaded({ id, data, sent, onSent, onEdit }: { id: string; data: SponsorOfferBoard; sent: boolean; onSent: () => void; onEdit: () => void }) {
  return <>
    <Breadcrumb href={`/events/${id}`} parent={data.eventTitle} current="Sponsor" />
    <PageTitle title="Ajak sponsor.">Kirim permintaan dukungan ke perusahaan sponsor yang sudah diverifikasi. Mereka menerima notifikasi dan menanggapinya dari dashboard sponsor.</PageTitle>
    {sent && <Notice>Permintaan terkirim. Sponsor menerima notifikasi.</Notice>}
    {data.eventPublished ? <OfferForm id={id} onSent={onSent} onEdit={onEdit} /> : <Notice>Permintaan sponsor hanya bisa dikirim untuk acara yang terpublikasi. Publikasi acara masih dalam pengembangan.</Notice>}
    <section className={styles.section} aria-labelledby="sent-offers-title">
      <h2 id="sent-offers-title">Permintaan terkirim</h2>
      {!data.items.length ? <EmptyState title="Belum ada permintaan.">Permintaan yang kamu kirim beserta tanggapan sponsor tampil di sini.</EmptyState>
        : <ul className={styles.proposals}>{data.items.map((item) => <li key={item.id}>
          <div className={styles.proposalHeader}><h3>{item.sponsorName}</h3><Badge tone={offerTone(item.status)}>{offerLabel[item.status]}</Badge></div>
          <p>{item.category}{item.amountLabel ? ` · ${item.amountLabel}` : ""}</p>
          <details><summary>Detail permintaan</summary><p>{item.message}</p>{item.proposalUrl && <p><a href={item.proposalUrl} target="_blank" rel="noopener noreferrer">Buka dokumen proposal</a></p>}</details>
        </li>)}</ul>}
    </section>
  </>;
}

function OfferForm({ id, onSent, onEdit }: { id: string; onSent: () => void; onEdit: () => void }) {
  const sponsors = useResource("sponsor-directory", listSponsorDirectory);
  const [values, setValues] = useState({ sponsorId: "", category: "", message: "", amountLabel: "", proposalUrl: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const order = ["sponsorId", "category", "message", "amountLabel", "proposalUrl"];
  const set = (key: keyof typeof values) => (value: string) => { setValues((previous) => ({ ...previous, [key]: value })); setErrors((previous) => ({ ...previous, [key]: "" })); setFailure(""); onEdit(); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found: Record<string, string> = {};
    if (!values.sponsorId) found.sponsorId = "Pilih sponsor.";
    if (!values.category) found.category = "Pilih bentuk dukungan.";
    if (values.message.trim().length < 20) found.message = "Jelaskan permintaanmu, minimal 20 karakter.";
    if (values.proposalUrl.trim() && !/^https:\/\/\S+$/.test(values.proposalUrl.trim())) found.proposalUrl = "Masukkan tautan yang diawali https://.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(form.current, order, found); return; }
    setBusy(true); setFailure("");
    try {
      await createOffer(id, { sponsorId: values.sponsorId, category: values.category, message: values.message.trim(), amountLabel: values.amountLabel.trim() || null, proposalUrl: values.proposalUrl.trim() || null });
      onSent();
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) { setErrors(error.fields); focusFirstError(form.current, order, error.fields); }
    } finally { setBusy(false); }
  }
  return <section className={styles.section} aria-labelledby="new-offer-title">
    <h2 id="new-offer-title">Permintaan baru</h2>
    {sponsors.status === "loading" ? <Loading>Memuat daftar sponsor…</Loading>
      : sponsors.status === "error" ? <Notice error>{errorMessage(sponsors.error)} <button className={uiStyles.secondary} onClick={sponsors.reload}>Muat ulang</button></Notice>
      : !sponsors.data?.length ? <EmptyState title="Belum ada sponsor terverifikasi.">Sponsor muncul di sini setelah akunnya disetujui admin.</EmptyState>
      : <form ref={form} className={`${uiStyles.form} ${styles.offerForm}`} onSubmit={submit} noValidate>
        <SelectField name="sponsorId" label="Sponsor" value={values.sponsorId} onChange={set("sponsorId")} options={sponsors.data.map((item) => ({ value: item.id, label: `${item.companyName} (${item.industry})` }))} error={errors.sponsorId} disabled={busy} />
        <SelectField name="category" label="Bentuk dukungan" value={values.category} onChange={set("category")} options={supportCategories} error={errors.category} disabled={busy} />
        <TextAreaField name="message" label="Pesan untuk sponsor" value={values.message} onChange={set("message")} maxLength={1000} error={errors.message} hint="Jelaskan acaramu, dukungan yang kamu harapkan, dan manfaat untuk sponsor. Minimal 20 karakter." disabled={busy} />
        <TextField name="amountLabel" label="Nilai dukungan" optional value={values.amountLabel} onChange={set("amountLabel")} maxLength={60} error={errors.amountLabel} hint="Misalnya Rp10 juta, atau kosongkan untuk dukungan non-dana." disabled={busy} />
        <TextField name="proposalUrl" label="Tautan proposal" optional type="url" inputMode="url" value={values.proposalUrl} onChange={set("proposalUrl")} maxLength={300} error={errors.proposalUrl} hint="Tautan ke dokumen proposal. File tidak diunggah di versi ini." disabled={busy} />
        {failure && <Notice error>{failure}</Notice>}
        <button className={uiStyles.primary} disabled={busy}>{busy ? "Mengirim…" : "Kirim permintaan"}</button>
      </form>}
  </section>;
}
