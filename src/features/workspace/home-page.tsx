"use client";

import localFont from "next/font/local";
import { useRef, useState, type ReactNode } from "react";
import {
  demoEvents,
  demoSponsors,
  filterDemoEvents,
  type DemoEvent,
  type PreviewState,
} from "./demo-data";
import { Icon } from "./icon";
import { LogoWordmark } from "@/lib/ui/icons";
import styles from "./workspace.module.css";

const displayFont = localFont({
  src: "./fonts/bricolage-700.ttf",
  weight: "700",
  variable: "--font-heading",
  display: "swap",
});
const bodyFont = localFont({
  src: [
    { path: "./fonts/manrope-400.ttf", weight: "400" },
    { path: "./fonts/manrope-600.ttf", weight: "600" },
  ],
  variable: "--font-body",
  display: "swap",
});

export default function HomePage({
  eventBuilder,
}: {
  eventBuilder: ReactNode;
}) {
  const [view, setView] = useState<"events" | "sponsors" | "builder">("events");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState<PreviewState>("empty");
  const [selected, setSelected] = useState<DemoEvent>(demoEvents[0]);
  const heading = useRef<HTMLHeadingElement>(null);
  const contextHeading = useRef<HTMLHeadingElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const events = filterDemoEvents(query, filter);

  function navigate(next: typeof view) {
    setView(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  function updateFilters(nextQuery: string, nextFilter: string) {
    setQuery(nextQuery);
    setFilter(nextFilter);
    const matches = filterDemoEvents(nextQuery, nextFilter);
    if (matches.length && !matches.some((event) => event.id === selected.id))
      setSelected(matches[0]);
  }

  function selectEvent(event: DemoEvent) {
    setSelected(event);
    if (window.matchMedia("(max-width: 950px)").matches) {
      requestAnimationFrame(() => {
        contextHeading.current?.focus({ preventScroll: true });
        contextHeading.current?.scrollIntoView({ block: "start" });
      });
    }
  }

  const sponsorContent = (
    <section className={styles.sponsorPanel} aria-labelledby="sponsor-heading">
      <div className={styles.panelHeading}>
        <h2 id="sponsor-heading">Komitmen, bukan cuma logo.</h2>
        <p>Forum Kolaborasi Kampus</p>
      </div>
      <ul>
        {demoSponsors.map((sponsor) => (
          <li key={sponsor.name}>
            <span className={styles.sponsorLetter}>{sponsor.initials}</span>
            <div>
              <strong>{sponsor.name}</strong>
              <p>{sponsor.action}</p>
              <span>
                {sponsor.label} · {sponsor.date} 2026
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.sponsorFoot}>
        <span>
          <strong>2 / 4</strong> benefit terverifikasi
        </span>
        <p>
          Proposal, follow-up, lalu bukti pemenuhan. Verifikasi bukan sekadar
          menambahkan tautan.
        </p>
      </div>
    </section>
  );

  return (
    <div
      className={`${styles.workspace} ${displayFont.variable} ${bodyFont.variable}`}
    >
      <a className={styles.skipLink} href="#main">
        Langsung ke konten
      </a>
      <header className={styles.header}>
        <button
          className={styles.brand}
          onClick={() => navigate("events")}
          aria-label="PartnerHub, kembali ke workspace"
        >
          <LogoWordmark width={188} />
        </button>
        <nav aria-label="Workspace utama">
          <button
            onClick={() => navigate("events")}
            aria-current={view === "events" ? "page" : undefined}
          >
            Event kamu
          </button>
          <button
            onClick={() => { setPreview("demo"); navigate("sponsors"); }}
            aria-current={view === "sponsors" ? "page" : undefined}
          >
            Sponsor
          </button>
          <button
            onClick={() => navigate("builder")}
            aria-current={view === "builder" ? "page" : undefined}
          >
            Susun event
          </button>
        </nav>
        <button
          className={styles.helpButton}
          onClick={() => helpDialog.current?.showModal()}
        >
          Penyimpanan & akses <Icon name="info" size={20} />
        </button>
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
        <div
          className={`${styles.pageIntro} ${view === "builder" ? styles.editorIntro : ""}`}
        >
          <div>
            <h1 ref={heading} tabIndex={-1}>
              {view === "builder" ? (
                <>Susun eventmu.</>
              ) : view === "sponsors" ? (
                <>
                  Kolaborasi yang
                  <br />
                  bisa dipertanggungjawabkan.
                </>
              ) : (
                <>
                  Ada ide?
                  <br />
                  Jadikan event.
                </>
              )}
            </h1>
            <p>
              {view === "builder"
                ? "Detail, identitas visual, dan kebutuhan acara, dalam satu tempat."
                : view === "sponsors"
                  ? "Lacak percakapan. Jaga komitmen. Tunjukkan buktinya."
                  : "Ruang kerja untuk organisasi, komunitas, dan tim penyelenggara acara."}
            </p>
          </div>
          {view !== "builder" && (
            <button
              className={styles.createButton}
              onClick={() => navigate("builder")}
            >
              <span>Susun event baru</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>

        <div hidden={view !== "builder"}>{eventBuilder}</div>

        {view !== "builder" && (
          <>
            {preview === "demo" && (
              <div className={styles.demoBar}>
                <Icon name="info" size={19} />
                <p>
                  <strong>Ruang kerja acara.</strong> Pantau persiapan, pendaftaran dan komitmen sponsor.
                </p>
                <button
                  onClick={() =>
                    setPreview(preview === "demo" ? "empty" : "demo")
                  }
                >
                  {preview === "demo" ? "Lihat tanpa data" : "Kembali ke acara"}
                </button>
              </div>
            )}
            {preview !== "demo" ? (
              <section
                className={styles.emptyState}
                aria-live="polite"
                aria-busy={preview === "loading"}
              >
                <h2>
                  {preview === "empty"
                    ? "Event berikutnya mulai di sini."
                    : preview === "loading"
                      ? "Menyiapkan ruang kerjamu."
                      : "Ruang kerja belum bisa dibuka."}
                </h2>
                <p>
                  {preview === "empty"
                    ? "Susun detail acara, unggah identitas visual, lalu buat acara untuk melanjutkan persiapan."
                    : preview === "loading"
                      ? "Sedang memuat informasi acara."
                      : "Informasi acara belum dapat dimuat. Coba lagi; coba muat ulang halaman."}
                </p>
                <button
                  className={styles.createButton}
                  onClick={() =>
                    preview === "empty"
                      ? navigate("builder")
                      : setPreview("demo")
                  }
                >
                  {preview === "empty"
                    ? "Buat acara pertama"
                    : "Kembali ke acara"}
                  <Icon name="arrow" />
                </button>
              </section>
            ) : view === "sponsors" ? (
              sponsorContent
            ) : (
              <div className={styles.deskLayout}>
                <section
                  className={styles.eventSection}
                  aria-labelledby="events-title"
                >
                  <div className={styles.eventSectionHeading}>
                    <h2 id="events-title">Di meja kerjamu.</h2>
                    <span>{events.length} event</span>
                  </div>
                  <div className={styles.filters}>
                    <div
                      className={styles.filterButtons}
                      role="group"
                      aria-label="Filter status event"
                    >
                      {[
                        ["all", "Semua"],
                        ["PUBLISHED", "Terpublikasi"],
                        ["DRAFT", "Belum dipublikasikan"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          aria-pressed={filter === value}
                          onClick={() => updateFilters(query, value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <label className={styles.search}>
                      <Icon name="search" size={20} />
                      <span className={styles.srOnly}>Cari event</span>
                      <input
                        type="search"
                        value={query}
                        onChange={(event) =>
                          updateFilters(event.target.value, filter)
                        }
                        placeholder="Cari event"
                      />
                    </label>
                  </div>
                  <div className={styles.eventRows}>
                    {events.map((event) => (
                      <button
                        key={event.id}
                        className={`${styles.eventRow} ${selected.id === event.id ? styles.selectedRow : ""}`}
                        aria-pressed={selected.id === event.id}
                        onClick={() => selectEvent(event)}
                      >
                        <span
                          className={
                            event.status === "PUBLISHED"
                              ? styles.eventCover
                              : styles.workshopCover
                          }
                        >
                          <span className={styles.coverCategory}>
                            {event.status === "PUBLISHED"
                              ? "Forum kampus"
                              : "Workshop"}
                          </span>
                          <span className={styles.coverType}>
                            {event.status === "PUBLISHED" ? (
                              <>
                                Temu.
                                <br />
                                Ide.
                                <br />
                                Aksi.
                              </>
                            ) : (
                              <>
                                Belajar.
                                <br />
                                Bareng.
                              </>
                            )}
                          </span>
                          <span className={styles.coverDate}>
                            {event.status === "PUBLISHED"
                              ? "14 NOV 2026"
                              : "28 NOV 2026"}
                          </span>
                        </span>
                        <span className={styles.eventInfo}>
                          <span className={styles.eventTitle}>
                            {event.title}
                          </span>
                          <span className={styles.eventMeta}>
                            {event.date} · WIB
                            <br />
                            {event.venue}
                          </span>
                          <span className={styles.eventRowBottom}>
                            <span className={styles.eventStatus}>
                              {event.status === "PUBLISHED"
                                ? "Terpublikasi"
                                : "Belum dipublikasikan"}
                            </span>
                            <span>
                              {selected.id === event.id
                                ? "Sedang dilihat"
                                : "Lihat event"}
                              <Icon name="arrow" size={18} />
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {!events.length && (
                    <div className={styles.noResults} role="status">
                      <h3>Tidak ada event yang cocok.</h3>
                      <p>Ubah kata pencarian atau tampilkan semua event.</p>
                      <button
                        onClick={() => {
                          setQuery("");
                          setFilter("all");
                        }}
                      >
                        Reset pencarian
                      </button>
                    </div>
                  )}
                  <button
                    className={styles.newEventRow}
                    onClick={() => navigate("builder")}
                  >
                    <span>Ide berikutnya punya tempat di sini.</span>
                    <strong>
                      Susun event baru <Icon name="arrow" />
                    </strong>
                  </button>
                </section>
                {events.length > 0 && (
                  <aside
                    className={styles.contextPanel}
                    aria-label="Ringkasan event pilihan"
                    aria-live="polite"
                  >
                    <div className={styles.contextHeading}>
                      <h2 ref={contextHeading} tabIndex={-1}>
                        {selected.title}
                      </h2>
                      <span>Yang sedang kamu lihat</span>
                    </div>
                    <div className={styles.contextCounts}>
                      <div>
                        <strong>{selected.registrations}</strong>
                        <span>peserta</span>
                      </div>
                      <div>
                        <strong>{selected.applications}</strong>
                        <span>aplikasi panitia</span>
                      </div>
                    </div>
                    <div className={styles.capacity}>
                      <div>
                        <span>Kapasitas registrasi</span>
                        <strong>
                          {selected.registrations} / {selected.capacity}
                        </strong>
                      </div>
                      <progress
                        value={selected.registrations}
                        max={selected.capacity}
                        aria-label={`Kapasitas registrasi ${selected.title}`}
                      />
                    </div>
                    <div className={styles.contextNote}>
                      <Icon
                        name={
                          selected.status === "PUBLISHED"
                            ? "sponsorship"
                            : "event"
                        }
                        size={24}
                      />
                      <h3>
                        {selected.status === "PUBLISHED"
                          ? "Janji sponsor belum selesai."
                          : "Masih bisa kamu bentuk."}
                      </h3>
                      <p>
                        {selected.status === "PUBLISHED"
                          ? "Dua benefit masih menunggu bukti. Bukan sekadar sponsor tercatat, komitmennya juga perlu terjaga."
                          : "Event ini belum dipublikasikan. Lengkapi detail melalui halaman edit acara."}
                      </p>
                      <button
                        onClick={() =>
                          navigate(
                            selected.status === "PUBLISHED"
                              ? "sponsors"
                              : "builder",
                          )
                        }
                      >
                        {selected.status === "PUBLISHED"
                          ? "Tinjau sponsor"
                          : "Buat acara"}
                        <Icon name="arrow" size={20} />
                      </button>
                    </div>
                  </aside>
                )}
              </div>
            )}
          </>
        )}
        <footer className={styles.footer}>
          <p>PartnerHub, dari ide sampai komitmen terpenuhi.</p>
          <section className={styles.previewOptions} aria-label="Tampilan data">
            <h2>Tampilan data</h2>
            <label>
              Status tampilan
              <select
                aria-label="Mode pratinjau"
                value={preview}
                onChange={(event) =>
                  setPreview(event.target.value as PreviewState)
                }
              >
                <option value="demo">Daftar acara</option>
                <option value="empty">Kosong</option>
                <option value="loading">Memuat</option>
                <option value="error">Gagal</option>
              </select>
            </label>

          </section>
        </footer>
      </main>

      <dialog
        ref={helpDialog}
        className={styles.helpDialog}
        aria-labelledby="prototype-title"
      >
        <div className={styles.dialogTop}>
          <h2 id="prototype-title">Penyimpanan & akses</h2>
          <button
            aria-label="Tutup penjelasan"
            onClick={() => helpDialog.current?.close()}
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <p>
          Susun event, unggah logo acara dan penyelenggara, tambahkan sponsor
          yang boleh ditampilkan, lalu periksa halaman event sebelum membuat acara.
        </p>
        <p>
          Periksa detail dan identitas acara sebelum melanjutkan pendaftaran, panitia, tiket dan sponsorship.
        </p>
        <p>
          Gunakan informasi yang diperlukan untuk penyelenggaraan acara dan batasi akses pengelola sesuai tanggung jawabnya.
        </p>
        <button
          className={styles.createButton}
          onClick={() => {
            helpDialog.current?.close();
            navigate("builder");
          }}
        >
          Susun event <Icon name="arrow" />
        </button>
      </dialog>
    </div>
  );
}
