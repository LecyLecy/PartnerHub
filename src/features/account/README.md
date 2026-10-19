# Account frontend

Updated: 18 October 2026. Owns login, role registration, verification/recovery, reusable profile and settings UI. Production backend owner: src/backend/account.

Accounts register as user, organizer or sponsor, with email verification and approval status. Event participant/committee/manager relations are separate. Frontend guards steer navigation; production APIs must enforce permissions.

Signup form state is in memory only, with no persisted signup draft. Role switching retains shared values while clearing role-only fields/documents as appropriate; credentials and files must not be stored as a browser draft.

Sponsors choose their industry during registration using the shared matching vocabulary. The local registration service validates the industry and initializes the matching profile from that selection, without a second post-login setup. Industry and matching fields cannot subsequently be edited through the matching/profile endpoints. Existing stored profiles remain unchanged; a missing legacy profile may only read its known registration industry, never invent a field.

Account popup says Pengaturan, not Profil. /settings is Pengaturan akun, retains profile editing and has no Back control. No profile item remains in role sidebars. Active verified organizers alone see Pembayaran > Riwayat transaksi here. History is not linked from Subscription or sidebars; /organizer/transactions retains authorization and returns to settings via header Back.

Use existing session/services and shared custom confirmations, including unsaved-change protection and logout. Preserve Ganti peran demo. Do not ask assistant identity-onboarding questions to begin project work.

Onboarding follows the current event lifecycle: complete setup, review privately in Arsip acara, then upload with per-event payment or an eligible subscription. It does not advertise draft saving. Participant guidance distinguishes Tiket saya from Lamaran saya and explains that issued QR requires the optional module. Restricted mobile account navigation also uses Pengaturan, without expanding access permissions.

Connected local demo flows exist. Production authentication provider, secure cookie/session lifecycle, approval tooling, email, recovery-token rules, persistence, retention/deletion and consent remain **In progress**. Do not collect real personal/verification documents until the approved production safeguards are implemented.

See PRD.md, ARCHITECTURE.md and todobackend.md for current requirements. tests/account and workspace subscription/settings browser checks cover local behavior, not production security.
