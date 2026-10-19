"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Asset, EventBrandingInput, EventRecord } from "@/contracts/event";
import { useResource } from "@/lib/use-resource";
import { ApiError, errorMessage } from "@/lib/api-client";
import { Breadcrumb, ProtectedPage, PageTitle, Notice, Loading, uiStyles } from "@/lib/ui";
import styles from "./event-draft.module.css";
import EventDraftBuilder from "./event-draft-builder";
import { draftToInput, localTime, recordToEditor, registrationError } from "./editor-model";
import type { EventDraft } from "./draft";
import type { EventBranding, LogoAsset } from "./event-branding";
import { createEvent, getEvent, updateEvent, uploadAsset } from "./services/event-service";

export default function EventEditorPage({ id }: { id?: string }) {
  return <ProtectedPage>{id ? <ExistingEditor id={id} /> : <Editor />}</ProtectedPage>;
}

function ExistingEditor({ id }: { id: string }) {
  const resource = useResource(id, getEvent);
  if (resource.status === "loading") return <Loading>Memuat acara…</Loading>;
  if (resource.status === "error") {
    return <Notice error>
      {errorMessage(resource.error)}
      <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button>
      <Link href="/organizer">Daftar event</Link>
    </Notice>;
  }
  if (!resource.data) return null;
  const event = resource.data;
  if (event.status !== "DRAFT") {
    return <>
      <PageTitle title="Acara ini sudah dipublikasikan." />
      <Notice>Detail acara yang sudah dipublikasikan tidak dapat diubah dari halaman ini.</Notice>
      <Link href={`/events/${id}`}>Lihat detail event</Link>
    </>;
  }
  if (event.startsAt && event.endsAt && localTime(event.startsAt).slice(0, 10) !== localTime(event.endsAt).slice(0, 10)) {
    return <Notice error>Editor ini hanya mendukung jadwal satu hari (WIB). Data multi-hari tidak diubah. <Link href={`/events/${id}`}>Lihat detail</Link></Notice>;
  }
  return <Editor key={id} record={event} />;
}

function Editor({ record }: { record?: EventRecord }) {
  const router = useRouter();
  const current = useRef(record);
  const creationKey = useRef<string | null>(null);
  const uploads = useRef(new Map<Blob, Asset>());
  const uploadKeys = useRef(new Map<Blob, string>());
  const [opens, setOpens] = useState(localTime(record?.registrationOpensAt || null));
  const [closes, setCloses] = useState(localTime(record?.registrationClosesAt || null));
  const [periodDirty, setPeriodDirty] = useState(false);
  const [periodError, setPeriodError] = useState("");
  const [stale, setStale] = useState(false);
  const [partialId, setPartialId] = useState<string | null>(null);

  async function save(draft: EventDraft, branding: EventBranding) {
    const period = registrationError(opens, closes, draft);
    setPeriodError(period || "");
    if (period) throw new ApiError(period, 422, "VALIDATION_ERROR");

    const remote = (logo: LogoAsset | null) => logo && "remote" in logo ? logo.remote : null;
    let inputBranding: EventBrandingInput = {
      organizationName: branding.organizationName.trim(),
      eventLogo: remote(branding.eventLogo),
      organizationLogo: remote(branding.organizationLogo),
      sponsors: branding.sponsors.map(item => ({ id: item.id, name: item.name.trim(), logo: remote(item.logo) })),
    };
    creationKey.current ||= crypto.randomUUID();
    if (!current.current) {
      current.current = await createEvent(draftToInput(draft, inputBranding, opens, closes), creationKey.current);
      setPartialId(current.current.id);
    }
    const id = current.current.id;

    async function upload(logo: LogoAsset | null, slot: "event" | "organization" | "sponsor"): Promise<Asset | null> {
      if (!logo) return null;
      if ("remote" in logo) return logo.remote;
      const cached = uploads.current.get(logo.file);
      if (cached) return cached;
      let key = uploadKeys.current.get(logo.file);
      if (!key) {
        key = crypto.randomUUID();
        uploadKeys.current.set(logo.file, key);
      }
      const asset = await uploadAsset(id, slot, logo.file, logo.name, key);
      uploads.current.set(logo.file, asset);
      return asset;
    }

    // Retain created IDs and accepted uploads after partial failure so retries cannot create a second event.
    inputBranding = {
      ...inputBranding,
      eventLogo: await upload(branding.eventLogo, "event"),
      organizationLogo: await upload(branding.organizationLogo, "organization"),
      sponsors: await Promise.all(branding.sponsors.map(async item => ({
        id: item.id, name: item.name.trim(), logo: await upload(item.logo, "sponsor"),
      }))),
    };
    try {
      current.current = await updateEvent(id, current.current.revision, draftToInput(draft, inputBranding, opens, closes));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setStale(true);
      throw error;
    }
    setStale(false);
    setPartialId(null);
    setPeriodDirty(false);
    router.replace(record ? `/events/${id}?saved=1` : `/organizer/archive?created=${encodeURIComponent(id)}`);
  }

  return <>
    <Breadcrumb href={record ? `/events/${record.id}` : "/organizer"} parent={record ? "Ringkasan acara" : "Acara kamu"} current={record ? "Edit acara" : "Acara baru"}/>
    <PageTitle title={record ? "Edit detail acara" : "Susun acara baru"}>
      Lengkapi informasi acara, jadwal, dan modul yang dibutuhkan. Acara yang selesai disusun masuk Arsip acara sebelum diunggah.
    </PageTitle>
    {partialId && <Notice>
      Acara sudah dibuat, tetapi logo atau perubahan terakhir belum tersimpan.
      Coba simpan lagi dari halaman ini untuk melanjutkan acara yang sama tanpa membuat duplikat.
      <Link href={`/events/${partialId}`}>Lihat acara</Link>
    </Notice>}
    {stale && <Notice error>
      Versi server sudah berubah. Salin isian penting sebelum memuat ulang, perubahan di halaman ini tidak digabung otomatis.
      <button className={uiStyles.secondary} onClick={() => window.location.assign(`/events/${current.current!.id}/edit`)}>
        Muat versi server
      </button>
    </Notice>}
    <EventDraftBuilder initial={recordToEditor(record)} onSave={save} saveLabel={record ? "Simpan perubahan" : "Selesai susunan"} extraDirty={periodDirty} fieldsLocked={Boolean(record)}>
      <section className={`${uiStyles.form} ${styles.registrationPeriod}`} aria-labelledby="registration-period-title">
        <h3 id="registration-period-title">Periode pendaftaran</h3>
        <p className={uiStyles.hint}>Menggunakan WIB. Isi tanggal buka dan tutup bersamaan, atau atur sebelum publikasi.</p>
        <label>Registrasi dibuka
          <input type="datetime-local" value={opens} onChange={event => {
            setOpens(event.target.value); setPeriodDirty(true); setPeriodError("");
          }} />
        </label>
        <label>Registrasi ditutup
          <input type="datetime-local" value={closes} onChange={event => {
            setCloses(event.target.value); setPeriodDirty(true); setPeriodError("");
          }} />
        </label>
        {periodError && <Notice error>{periodError}</Notice>}
      </section>
    </EventDraftBuilder>
  </>;
}
