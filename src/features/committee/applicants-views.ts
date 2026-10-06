// Plain module (no "use client") so the server route and the client page can share it.
export const applicantsViews = ["pelamar", "seleksi", "diterima"] as const;
export type ApplicantsView = (typeof applicantsViews)[number];
export const isApplicantsView = (value: string): value is ApplicantsView => (applicantsViews as readonly string[]).includes(value);