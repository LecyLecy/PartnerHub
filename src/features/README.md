# Frontend feature ownership

Each feature owns its UI, client state, and API calls in its named folder. The `workspace` feature owns the existing foundation homepage.

Product features: `account`, `event`, `registration`, `committee`, `attendance`, `sponsorship`. All remain **In progress**.

Do not import `src/backend`, Prisma, or another feature's internals. Keep pages in `src/app` as thin composition adapters. Shared transport types belong in `src/contracts` only after agreement. Shared frontend utilities belong in `src/lib`.

Only add components, hooks, and API clients when needed. There is no required boilerplate or barrel file. Follow the root `AGENTS.md` scope gate before changing anything.
