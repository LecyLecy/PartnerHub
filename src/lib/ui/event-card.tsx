"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { PublicEvent } from "@/contracts/participation";
import { formatPrice } from "../money";
import { eventWhen } from "../public-events";
import { Icon } from "./icons";
import { Badge } from "./primitives";
import styles from "./event-card.module.css";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";

/** Organizer avatar: the organization logo when there is one, otherwise initials. */
export function OrganizerAvatar({ name, logoUrl, size = "sm" }: { name: string; logoUrl: string | null; size?: "sm" | "lg" }) {
  return <span className={styles.avatar} data-size={size} aria-hidden="true">
    {logoUrl
      // Server-approved image URLs cannot go through next/image until storage is configured.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={logoUrl} alt="" />
      : initials(name)}
  </span>;
}

export type CardCover = { organization: string; organizationLogoUrl: string | null; imageUrl: string | null; title: string };

function Cover({ cover, tone, as: Heading, children }: { cover: CardCover; tone: number; as: "h2" | "h3"; children?: ReactNode }) {
  return <div className={styles.cover} data-tone={tone % 3} data-image={Boolean(cover.imageUrl)}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {cover.imageUrl && <img className={styles.coverImage} src={cover.imageUrl} alt="" />}
    {children}
    <p className={styles.organizer}><OrganizerAvatar name={cover.organization} logoUrl={cover.organizationLogoUrl} /><span>{cover.organization || "Penyelenggara"}</span></p>
    <Heading>{cover.title}</Heading>
  </div>;
}

export function EventGrid({ children, label }: { children: ReactNode; label?: string }) {
  return <ul className={styles.grid} aria-label={label}>{children}</ul>;
}

/** Section inside a detail dialog. */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id}><h3 id={id}>{title}</h3>{children}</section>;
}

/**
 * The one card used for events, committee openings, and applications. The organizer sits on top of the cover, the cover
 * is the event logo, and the only control is "Detail". Everything else, including role actions, lives in the dialog so
 * nothing is triggered from a half-read card. Rows stay aligned: fixed cover height, body grows, the button sits last.
 */
export function InfoCard({ cover, tone, badge, summary, detail }: {
  cover: CardCover; tone: number; badge?: ReactNode; summary: ReactNode; detail: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  const close = () => setOpen(false);
  return <li className={styles.card}>
    <Cover cover={cover} tone={tone} as="h3" />
    <div className={styles.body}>
      {badge}
      <div className={styles.summary}>{summary}</div>
      <button type="button" className={styles.detail} aria-haspopup="dialog" aria-label={`Detail ${cover.title}`} onClick={() => setOpen(true)}>Detail</button>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} onClose={close} onClick={(click) => { if (click.target === dialog.current) close(); }}>
      {open && <>
        <div className={styles.cover} data-tone={tone % 3} data-image={Boolean(cover.imageUrl)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover.imageUrl && <img className={styles.coverImage} src={cover.imageUrl} alt="" />}
          <button type="button" className={styles.close} aria-label="Tutup detail" onClick={close}><Icon name="close" /></button>
          <p className={styles.organizer}><OrganizerAvatar name={cover.organization} logoUrl={cover.organizationLogoUrl} /><span>{cover.organization || "Penyelenggara"}</span></p>
          <h2 id={titleId}>{cover.title}</h2>
        </div>
        <div className={styles.dialogBody}>{detail(close)}</div>
      </>}
    </dialog>
  </li>;
}

export const eventCover = (event: PublicEvent): CardCover => ({ organization: event.organizationName, organizationLogoUrl: event.organizationLogoUrl, imageUrl: event.eventLogoUrl, title: event.title });

/** Public event card for participants and sponsors. `actions` render inside the dialog. */
export function EventCard({ event, tone, badge, actions }: {
  event: PublicEvent; tone: number; badge?: ReactNode; actions: (close: () => void) => ReactNode;
}) {
  return <InfoCard cover={eventCover(event)} tone={tone} badge={badge}
    summary={<>
      <p className={styles.when}>{eventWhen(event.startsAt)}</p>
      <p className={styles.price} data-free={event.priceIdr <= 0}>{formatPrice(event.priceIdr)}</p>
      <p className={styles.muted}>{event.venue || "Lokasi belum ditentukan"}</p>
    </>}
    detail={(close) => <EventDetails event={event} actions={actions(close)} />} />;
}

/** Shared public content for catalog dialogs and shareable event pages. Never renders private sponsor records. */
export function EventDetails({ event, actions }: { event: PublicEvent; actions?: ReactNode }) {
  return <>
      <DetailSection title="Tentang acara">
        <Badge tone="neutral">{event.category}</Badge>
        <p>{event.summary || "Deskripsi belum dicantumkan."}</p>
      </DetailSection>
      <dl className={styles.facts}>
        <div><dt>Jadwal</dt><dd>{eventWhen(event.startsAt)}{event.endsAt ? ` sampai ${eventWhen(event.endsAt)}` : ""}</dd></div>
        <div><dt>Lokasi</dt><dd>{event.venue || "Belum ditentukan"}</dd></div>
        <div><dt>Harga tiket</dt><dd>{formatPrice(event.priceIdr)}{event.priceIdr > 0 && <span className={styles.muted}>Pembayaran dilakukan di luar PartnerHub, sesuai arahan penyelenggara.</span>}</dd></div>
      </dl>
      <DetailSection title="Penyelenggara">
        <p className={styles.orgLine}><OrganizerAvatar name={event.organizationName} logoUrl={event.organizationLogoUrl} size="lg" /><strong>{event.organizationName || "Belum dicantumkan"}</strong></p>
      </DetailSection>
      {event.sponsorNames.length > 0 && <DetailSection title="Sponsor pendukung">
        <ul className={styles.chips}>{event.sponsorNames.map((name) => <li key={name}>{name}</li>)}</ul>
      </DetailSection>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </>;
}
