import type { DemoDb } from "./types";

/** Only replace known old fixtures, never arbitrary user-entered text or whole records. */
export function upgradeFixtures(db: DemoDb, defaults: DemoDb): void {
  if ((db.fixtureRevision ?? 0) >= 1) return;
  const oldNames: Record<string, string> = {
    "demo-user": "Pengguna Demo", "demo-organizer": "Penyelenggara Demo", "demo-sponsor": "PIC Sponsor Demo", "demo-pending": "Penyelenggara Menunggu",
    "demo-sponsor-education": "PIC Edukasi Demo Nusantara", "demo-sponsor-media": "PIC Media Kreatif Demo", "demo-sponsor-food": "PIC Rasa Sehat Demo", "demo-sponsor-green": "PIC Energi Hijau Demo", "demo-sponsor-finance": "PIC Finansial Muda Demo",
  };
  const oldOrganizations = new Set(["Organisasi Demo Kampus", "Komunitas Demo Kota", "Komunitas Demo Baru", "Perusahaan Demo", "Edukasi Demo Nusantara", "Media Kreatif Demo", "Rasa Sehat Demo", "Energi Hijau Demo", "Finansial Muda Demo"]);
  for (const account of db.accounts) {
    const fresh = defaults.accounts.find(item => item.id === account.id);
    if (!fresh || !account.seeded) continue;
    if (account.fullName === oldNames[account.id]) account.fullName = fresh.fullName;
    for (const row of account.summary) {
      if (oldOrganizations.has(row.value) || row.value === "Kota Demo") row.value = fresh.summary.find(item => item.label === row.label)?.value ?? row.value;
    }
    if (!account.imageUrl) account.imageUrl = fresh.imageUrl;
    const oldDocuments = new Set(["surat-tugas-demo.pdf", "legalitas-demo.pdf", "legalitas-komunitas-demo.pdf"]);
    account.documents = account.documents.flatMap(item => oldDocuments.has(item.name) ? fresh.documents : [item]);
  }
  const oldVenues = new Set(["Aula Demo Utama", "Lab Kreatif Demo", "Taman Demo", "Ruang Seminar Demo", "Perpustakaan Demo", "Studio Demo", "Gedung Demo Timur"]);
  for (const event of db.events) {
    const fresh = defaults.events.find(item => item.id === event.id);
    if (!fresh) continue;
    if (oldVenues.has(event.venue)) event.venue = fresh.venue;
    if (oldOrganizations.has(event.branding.organizationName)) event.branding.organizationName = fresh.branding.organizationName;
    if (/^\/demo\/cover-[abc]\.svg$/.test(event.branding.eventLogo?.url ?? "")) event.branding.eventLogo = fresh.branding.eventLogo;
    if (/^\/demo\/org-(kampus|kota)\.svg$/.test(event.branding.organizationLogo?.url ?? "")) event.branding.organizationLogo = null;
    event.branding.sponsors.forEach((sponsor, index) => {
      if (/^Sponsor Demo [ABC]$/.test(sponsor.name) && fresh.branding.sponsors[index]) sponsor.name = fresh.branding.sponsors[index].name;
    });
  }
  const oldParticipants = new Set(["Peserta Demo Satu", "Peserta Demo Dua", "Peserta Demo Tiga", "Pengguna Demo", "Calon Panitia Demo", "Pelamar Demo Lain"]);
  const oldInstitutions = new Set(["Himpunan Teknik Demo", "Komunitas Baca Demo", "UKM Desain Demo", "Himpunan Desain Demo", "Komunitas Kreatif Demo"]);
  for (const registration of db.registrations) {
    if (registration.registrantName && oldParticipants.has(registration.registrantName)) registration.registrantName = db.accounts.find(item => item.id === registration.ownerId)?.fullName ?? registration.registrantName;
    for (const answer of registration.answers) {
      if (oldInstitutions.has(answer.value)) answer.value = defaults.registrations.find(item => item.id === registration.id)?.answers.find(item => item.fieldId === answer.fieldId)?.value ?? answer.value;
    }
  }
  for (const application of db.applications) {
    if (oldParticipants.has(application.applicantName)) application.applicantName = db.accounts.find(item => item.id === application.ownerId)?.fullName ?? application.applicantName;
    const oldNote = "Selamat bergabung. Langkah berikutnya: masuk ke grup WhatsApp panitia (tautan dikirim lewat email) dan hadir di rapat perdana hari Sabtu pukul 10.00 di Aula Demo.";
    if (application.id === "demo-a1" && application.note === oldNote) application.note = defaults.applications.find(item => item.id === application.id)?.note ?? application.note;
  }
  for (const opening of db.openings) {
    if (oldOrganizations.has(opening.organizationName)) opening.organizationName = defaults.openings.find(item => item.id === opening.id)?.organizationName ?? opening.organizationName;
  }
  const oldBodies: Record<string, string> = {
    "demo-n4": "Perusahaan Demo mengirim proposal dukungan untuk Workshop Desain Poster Acara.",
    "demo-n9": "Organisasi Demo Kampus mengajak Perusahaan Demo mendukung Temu Komunitas Relawan.",
  };
  for (const notification of db.notifications) {
    if (notification.body === oldBodies[notification.id]) notification.body = defaults.notifications.find(item => item.id === notification.id)?.body ?? notification.body;
  }
  for (const offer of db.offers) {
    if (oldOrganizations.has(offer.organizationName)) offer.organizationName = defaults.offers.find(item => item.id === offer.id)?.organizationName ?? offer.organizationName;
    if (offer.sponsorName === "Perusahaan Demo") offer.sponsorName = db.accounts.find(item => item.id === offer.sponsorId)?.summary.find(item => item.label === "Perusahaan")?.value ?? offer.sponsorName;
    if (offer.id === "demo-so1" && offer.message === "Kami mengundang Perusahaan Demo menjadi media partner untuk publikasi acara relawan.") offer.message = defaults.offers[0].message;
  }
  db.fixtureRevision = 1;
}
