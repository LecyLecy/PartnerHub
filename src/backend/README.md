# Backend feature ownership

Backend runs inside Next.js Route Handlers, not a separately deployed API. Supabase provides PostgreSQL; Prisma remains the persistence boundary. Supabase Auth, browser database access, and Edge Functions are not configured.

Each feature owns server validation, authorization, state transitions, and Prisma operations in its named folder. Runtime entry modules must import `server-only`. Route Handlers in `src/app/api` call these modules and return responses.

Do not import frontend modules or another feature's internals. Shared server infrastructure belongs in `src/backend/shared` and requires separate approval. Cross-feature integration requires an agreed contract, not direct imports added by one feature owner.

`health/service.ts` preserves the existing static health response. It does not connect to or test the database. Product services remain **In progress**.
