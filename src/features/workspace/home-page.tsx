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
        <p>Forum Kolaborasi Kampus · Data demo</p>
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
          <strong>2 / 4</strong> benefit contoh terverifikasi
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
          <svg
            viewBox="0 0 96 96"
            width="35"
            height="35"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M20 12h32c20 0 34 14 34 34S72 80 52 80H38v10H20V12Zm18 19v30h13c10 0 17-6 17-15s-7-15-17-15H38Z"
            />
          </svg>
          PartnerHub<span className={styles.brandDot}>.</span>
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
            Sponsor contoh
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
                  <strong>Ruang contoh.</strong> Event dan angka di bawah adalah
                  data demo, bukan aktivitas nyata.
                </p>
                <button
                  onClick={() =>
                    setPreview(preview === "demo" ? "empty" : "demo")
                  }
                >
                  {preview === "demo" ? "Lihat tanpa data" : "Kembali ke demo"}
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
                    ? "Susun detail acara, unggah identitas visual, lalu simpan draft di perangkatmu. Penyimpanan server dan publikasi belum terhubung."
                    : preview === "loading"
                      ? "Ini simulasi loading, tanpa permintaan ke server."
                      : "Ini simulasi error. Draft lokal dan isian formulir tidak diubah."}
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
                    ? "Susun draft pertama"
                    : "Kembali ke data demo"}
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
                    <span>{events.length} event contoh</span>
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
                        ["DRAFT", "Draft"],
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
                      <span className={styles.srOnly}>Cari event contoh</span>
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
                                : "Draft"}{" "}
                              · Demo
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
                      <span>Yang sedang kamu lihat · Demo</span>
                    </div>
                    <div className={styles.contextCounts}>
                      <div>
                        <strong>{selected.registrations}</strong>
                        <span>peserta contoh</span>
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
                        aria-label={`Kapasitas registrasi ${selected.title}, data demo`}
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
                          ? "Dua benefit contoh masih menunggu bukti. Bukan sekadar sponsor tercatat, komitmennya juga perlu terjaga."
                          : "Event contoh ini belum dipublikasikan. Alur draft lokal bisa kamu coba lewat Susun event baru."}
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
                          ? "Tinjau sponsor contoh"
                          : "Coba susun draft"}
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
          <details className={styles.previewOptions}>
            <summary>Tampilan contoh</summary>
            <label>
              Simulasi data
              <select
                aria-label="Mode pratinjau"
                value={preview}
                onChange={(event) =>
                  setPreview(event.target.value as PreviewState)
                }
              >
                <option value="demo">Data demo</option>
                <option value="empty">Kosong</option>
                <option value="loading">Memuat</option>
                <option value="error">Gagal (simulasi)</option>
              </select>
            </label>
            <p>
              Data contoh bukan event milikmu. Sinkronisasi server: In progress.
            </p>
          </details>
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
          yang boleh ditampilkan, lalu periksa halaman event sebelum menyimpan
          draft.
        </p>
        <p>
          Detail dan gambar draft disimpan di browser perangkat ini. Belum
          terhubung ke database, tidak dipublikasikan, dan belum menerbitkan
          tiket atau registrasi.
        </p>
        <p>
          Event serta sponsor yang ditampilkan di workspace adalah contoh
          berlabel demo. Jangan memasukkan data pribadi peserta.
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
