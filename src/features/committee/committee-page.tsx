"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { focusFirstError, MultiSelect, TextAreaField } from "@/lib/form/fields";
import { BackLink, Badge, DetailSection, EmptyState, EventGrid, InfoCard, Notice, PageHeader, ProtectedPage, SelectionSteps, SkeletonCards, StatGrid, uiStyles, useToast } from "@/lib/ui";
import type { CommitteeOpening } from "@/contracts/committee";
import { applyToOpening, listMyApplications, listOpenings } from "./services/committee-service";
import { selectionPath } from "./selection-path";
import styles from "./committee.module.css";

export default function CommitteePage() { return <ProtectedPage><Committee /></ProtectedPage>; }

function Chips({ label, items }: { label: string; items: string[] }) {
  return <div className={styles.chipGroup}><span className={styles.chipLabel}>{label}</span><ul className={styles.chips}>{items.map((name) => <li key={name}>{name}</li>)}</ul></div>;
}

const coverOf = (item: { organizationName: string; organizationLogoUrl: string | null; eventLogoUrl: string | null; eventTitle: string }) => ({ organization: item.organizationName, organizationLogoUrl: item.organizationLogoUrl, imageUrl: item.eventLogoUrl, title: item.eventTitle });

function OpeningCard({ item, tone, applied, onDone }: { item: CommitteeOpening; tone: number; applied: boolean; onDone: () => void }) {
  return <InfoCard cover={coverOf(item)} tone={tone} badge={applied ? <Badge tone="success">Sudah melamar</Badge> : undefined}
    summary={<><p className={styles.cardLine}>{item.divisions.length} divisi dibuka</p><p className={styles.muted}>{item.divisions.map((division) => division.name).join(", ")}</p></>}
    detail={(close) => <>
      <DetailSection title="Kebutuhan panitia"><p className={styles.note}>{item.description}</p></DetailSection>
      <Chips label="Divisi dibuka" items={item.divisions.map((division) => division.name)} />
      <DetailSection title="Proses seleksi">
        <SelectionSteps steps={selectionPath({ status: "SUBMITTED", stageId: null, stages: item.stages }).map((step, index) => ({ ...step, state: index === 0 ? "current" : "waiting" }))} label={`Tahapan seleksi ${item.eventTitle}`} />
        <p className={styles.note}>Penyelenggara menetapkan tahapan ini. Kamu akan diberi kabar setiap kali lamaranmu berpindah tahap.</p>
      </DetailSection>
      {!applied && <ApplyForm opening={item} onDone={() => { close(); onDone(); }} />}
    </>} />;
}

function Committee() {
  const openings = useResource("openings", listOpenings);
  const applications = useResource("my-applications", listMyApplications);
  const toast = useToast();
  const applied = new Set((applications.data ?? []).filter((item) => item.status !== "WITHDRAWN").map((item) => item.openingId));
  const openCount = openings.data?.length;
  const applicationCount = applications.data?.length;
  return <>
    <BackLink href="/me" />
    <PageHeader title="Jadi panitia.">Lihat lowongan panitia dari penyelenggara dan kirim lamaran. Lamaran yang sudah terkirim ada di <Link href="/me/events">Acara saya</Link>.</PageHeader>
    {openCount !== undefined && applicationCount !== undefined && <StatGrid items={[{ label: "lowongan terbuka", value: openCount }, { label: "lamaran saya", value: applicationCount }]} />}
    <section className={styles.panel} aria-labelledby="openings-title">
      <div className={styles.panelHead}><h2 id="openings-title">Lowongan panitia</h2><p>Acara yang sedang mencari panitia.</p></div>
      {openings.status === "loading" ? <SkeletonCards label="Memuat lowongan…" count={2} />
        : openings.status === "error" ? <Notice error>{errorMessage(openings.error)} <button className={uiStyles.secondary} onClick={openings.reload}>Muat ulang</button></Notice>
        : !openings.data?.length ? <EmptyState title="Belum ada lowongan.">Lowongan muncul setelah penyelenggara membukanya untuk acara yang terpublikasi.</EmptyState>
        : <EventGrid>{openings.data.map((item, index) => <OpeningCard key={item.id} item={item} tone={index} applied={applied.has(item.id)}
          onDone={() => { toast(`Lamaran untuk ${item.eventTitle} terkirim. Hasilnya muncul di Lamaran saya dan Notifikasi.`); applications.reload(); }} />)}</EventGrid>}
    </section>
  </>;
}

function ApplyForm({ opening, onDone }: { opening: CommitteeOpening; onDone: () => void }) {
  const [values, setValues] = useState({ divisionIds: [] as string[], motivation: "", answer: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const order = ["divisionIds", "motivation", "answer"];
  const key = (name: string) => `${name}-${opening.id}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found: Record<string, string> = {};
    if (!values.divisionIds.length) found.divisionIds = "Pilih minimal satu divisi.";
    if (values.motivation.trim().length < 20) found.motivation = "Ceritakan motivasimu, minimal 20 karakter.";
    if (opening.question && !values.answer.trim()) found.answer = "Jawab pertanyaan dari penyelenggara.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(form.current, order.filter((name) => found[name]).map(key), Object.fromEntries(Object.entries(found).map(([name, text]) => [key(name), text]))); return; }
    setBusy(true); setFailure("");
    try { await applyToOpening(opening.id, { divisionIds: values.divisionIds, motivation: values.motivation.trim(), answer: opening.question ? values.answer.trim() : null }); onDone(); }
    catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) { setErrors(error.fields); focusFirstError(form.current, order.map(key), Object.fromEntries(Object.entries(error.fields).map(([name, text]) => [key(name), text]))); }
    } finally { setBusy(false); }
  }
  return <DetailSection title="Lamar sebagai panitia">
    <form ref={form} className={uiStyles.form} onSubmit={submit} noValidate>
      <MultiSelect name={key("divisionIds")} label="Divisi yang kamu minati" value={values.divisionIds} onChange={(divisionIds) => { setValues({ ...values, divisionIds }); setErrors({ ...errors, divisionIds: "" }); }} options={opening.divisions.map((item) => ({ value: item.id, label: item.name }))} error={errors.divisionIds} disabled={busy} />
      <TextAreaField name={key("motivation")} label="Motivasi" value={values.motivation} onChange={(motivation) => { setValues({ ...values, motivation }); setErrors({ ...errors, motivation: "" }); }} maxLength={600} error={errors.motivation} hint="Ceritakan alasan dan pengalaman yang relevan. Minimal 20 karakter." disabled={busy} />
      {opening.question && <TextAreaField name={key("answer")} label={opening.question} value={values.answer} onChange={(answer) => { setValues({ ...values, answer }); setErrors({ ...errors, answer: "" }); }} maxLength={400} rows={3} error={errors.answer} disabled={busy} />}
      {failure && <Notice error>{failure}</Notice>}
      <button className={uiStyles.primary} disabled={busy}>{busy ? "Mengirim…" : "Kirim lamaran"}</button>
    </form>
  </DetailSection>;
}
