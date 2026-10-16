const paths = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  settings: <><path d="M4 7h8m4 0h4M4 17h4m4 0h8" /><circle cx="14" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1a4.5 4.5 0 0 1 4.5-4.5h2A4.5 4.5 0 0 1 14.5 18v1M16 5.2a3 3 0 0 1 0 5.6M20.5 19v-1a4.5 4.5 0 0 0-3-4.2" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  ticket: <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M10 12h10" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevron: <path d="m6 15 6-6 6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2v2M14 18h2v2h4v-2" /></>,
} as const;

export type IconName = keyof typeof paths;

/** One stroke weight across the product. Decorative: the label always sits in adjacent text or an aria-label. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 96 96" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M20 12h32c20 0 34 14 34 34S72 80 52 80H38v10H20V12Zm18 19v30h13c10 0 17-6 17-15s-7-15-17-15H38Z" /></svg>;
}
