# AssetFlow — FINDINGS

Verify-and-fix pass log. Format per check: `PASS`, `FIXED (what + why)`, or `BROKEN (needs decision)`.

## Phase 0 — Environment & smoke test

- **Dependencies**: `server/node_modules` and `client/node_modules` already populated. No install needed.
- **`.env`**: `BROKEN (needs decision)` — no `server/.env` exists, only `.env.example`. `DATABASE_URL` is unset.
- **Migrations**: `BROKEN (needs decision)` — `server/prisma/migrations/` does not exist at all (not gitignored, never committed), despite commit message "Added MySQL database and Prisma setup". There's also a stray empty `server/prisma/schema.prisma.bak-empty` (0 bytes, harmless, likely leftover — safe to delete later).
- **MySQL**: no local MySQL install found (checked PATH, XAMPP, WAMP, Windows services), no Docker available either.
- **Decision (user, 2026-07-12)**: database setup/migrations are owned by a teammate, not in scope for this session. Proceeding with:
  - `FIXED` — wrote `server/prisma/seed.ts`: 4 departments (Engineering/Sales/HR/Operations), 5 categories, 8 users (1 admin, 1 asset manager, 2 dept heads, 4 employees, all password `Password123!`), 18 assets across categories/statuses, 4 allocations (2 active, 1 overdue, 1 returned/history), 3 bookings (deliberately includes a same-asset-tomorrow slot that a live 3-5pm booking request would collide with, to demo the overlap 409), 3 maintenance requests (PENDING/APPROVED-with-asset-flipped-to-UNDER_MAINTENANCE/RESOLVED), 1 open audit cycle scoped to Engineering with 2 auditors and 2 pre-marked items (1 VERIFIED, 1 MISSING) so the discrepancy report has content immediately. Verified with `npx prisma generate` + `tsc --noEmit -p tsconfig.json` — typechecks cleanly against the real Prisma client types. **Cannot run it** (`npm run seed`) without a live `DATABASE_URL` — that's on whoever owns the DB, after `prisma migrate dev` has been run.
  - Static/code-level verification of Phase 1 backend invariants and Phase 3 client conventions (cannot do live request testing without a booted server+DB).
  - Phase 2 (browser E2E walkthroughs) is blocked entirely until DB is available.

## Phase 1 — Backend correctness (code-review only, DB unavailable)

No live server/DB, so these are static code-review verdicts, not request-tested. Anything needing a real request is marked accordingly for later live verification.

- **`/org/*` over-restricted**: `FIXED` — the whole `org.ts` router had `authorize(['ADMIN'])` applied blanket via `router.use`, including `GET /org/employees`, `GET /org/departments`, `GET /org/categories`. `Allocations.tsx` (already wired, reviewed as PASS in Phase 3) calls `GET /org/employees` to populate its allocate-dialog dropdown, and `ASSET_MANAGER` is allowed to allocate per spec — meaning this endpoint would 403 for the exact role that needs it. Split the router: GET routes (reference data needed across workflows) now only require `requireAuth`; POST/PATCH mutations (create/edit department or category, role promotion) stay `authorize(['ADMIN'])`.

- **Double-allocation (DB constraint)**: `BROKEN (needs decision)` — `schema.prisma` has no `active_asset_id` generated column / `uq_one_active_allocation` UNIQUE constraint (matches the earlier finding that no migrations exist at all). `errorHandler.ts:18-36` already has the P2002 → "currently held by {name}" catch fully written and ready, so the code is waiting on the migration, not missing logic. **Action needed from DB owner**: apply the raw-SQL migration from `architecture.md` §3:
  ```sql
  ALTER TABLE allocations
    ADD COLUMN active_asset_id INT
      GENERATED ALWAYS AS (IF(returned_at IS NULL, asset_id, NULL)) STORED,
    ADD CONSTRAINT uq_one_active_allocation UNIQUE (active_asset_id);
  ```
  Until then, allocation conflicts are only caught by an application-level `status !== AVAILABLE` check in `allocateAsset` (services/allocations.ts), which is TOCTOU-race-prone without the DB constraint as backstop.
- **Double-allocation (service message)**: `FIXED` — `allocateAsset` threw a generic "Asset is not available for allocation" instead of the spec's "This asset is currently held by {name}" (architecture.md §5). Updated `server/src/services/allocations.ts` to look up the active allocation's employee and include their name in the 409 message, matching the DB-constraint path in `errorHandler.ts` for when that lands.
- **Booking overlap**: `PASS` — `services/bookings.ts:createBooking` runs inside `prisma.$transaction`, does `SELECT ... FOR UPDATE` with `status <> 'CANCELLED' AND startTime < end AND endTime > start`, rejects with 409 "This slot overlaps an existing booking" before insert. Matches spec exactly. Needs a live request to confirm the adjacent-slot (4-5pm after 2-4pm) case actually is allowed — logic reads correct (strict `<`/`>`) but untested live.
- **Asset tag generation**: `PASS` — `registerAsset` inserts with placeholder `assetTag: 'TMP'`, then updates to `AF-000N` with `id.padStart(4,'0')` in the same transaction. Matches spec.
- **State machine side-effects**: `PASS` — verified across allocations, transfers, maintenance, audits:
  - allocate → `ALLOCATED`; return → `AVAILABLE` (allocations.ts)
  - maintenance `APPROVED` → `UNDER_MAINTENANCE`; `RESOLVED` → `AVAILABLE` (maintenance.ts)
  - transfer approved → old allocation closed (`returnedAt` set) + new allocation created, both inside one `$transaction` (transfers.ts)
  - audit close → confirmed-`MISSING` items set asset status to `LOST` via `updateMany`, cycle status → `CLOSED`, same transaction (audits.ts)
  - Booking → asset status isn't flipped to `RESERVED` on booking create, and cancel doesn't revert it. **Note**: architecture.md's state diagram lists `booking starts (bookable) → RESERVED` as a transition but doesn't fully specify timing (at booking-creation vs at the actual start time, since "no cron" is a stated constraint). Current code leaves asset status untouched by bookings entirely. This is ambiguous per the plan's own rule 6 ("if unclear, flag it rather than invent a shape") — flagging rather than guessing since "RESERVED" could reasonably mean "only reserved while the slot is ongoing," which would need a read-time computed status, not a stored side effect. **Needs a decision from the team.**
- **Client-supplied `status`**: `FIXED` — `PATCH /assets/:id` accepted a raw `status` enum straight from the client via `editSchema` in `controllers/assets.ts`, then passed it through to `prisma.asset.update` unfiltered — a direct violation of "Asset status is NEVER set from a raw client value." Removed `status` from `editSchema`; Zod strips unknown keys by default so no service-side change was needed once the schema field was removed.
- **Transaction integrity**: `PASS` (by inspection) — allocate, return, transfer-decide, maintenance-decide/status, audit-close, and asset-register all wrap their multi-step writes in `prisma.$transaction`. Rollback-on-failure is Prisma's default transaction behavior; not live-tested (would need to force a mid-transaction throw).
- **Activity logging**: `PASS` — every mutating service calls `logActivity(...)` with actor/action/entity.
- **Notifications**: `PASS` — `notify()` (lib/notify.ts) writes a `Notification` row and emits `notification:new` to `user:{userId}` via `emitToUser`. Called on transfer decide, maintenance decide/resolve, audit-cycle create. Not called on allocate/return/booking-create — reasonable (spec says "where an event warrants it"); the auditor-assignment and approval-chain events are the ones covered.
- **Authorization**: `PASS` — every mutating route has `authorize([...])` at the correct privilege level (allocations/assets/maintenance-decide → `ADMIN`/`ASSET_MANAGER`; audits create/close → `ADMIN`; org/* → `ADMIN` router-wide; transfers-decide → `ADMIN`/`ASSET_MANAGER`/`DEPT_HEAD`). Signup hard-codes `role: EMPLOYEE` (auth.ts). Role changes only via `POST /org/employees/:id/role`, itself behind the org router's blanket `authorize(['ADMIN'])`. Not live-tested (no DB to log in against).
- **Response envelope**: `PASS` — spot-checked every controller; all use `res.json({ ok: true, data })` on success. `errorHandler.ts` is registered last in `index.ts` and returns `{ ok: false, error }` for `AppError`, `ZodError`, Prisma `P2002`, and a generic 500 fallback.

**Not yet reviewed in this pass** (lower priority per the plan's triage order, will pick up if time remains): `reports.ts` (`utilization`/`status` report types exist but are minimal groupBy stubs; `message: 'Report type not implemented yet'` fallback for unknown types — fine as scaffolding, revisit under Phase 4 polish), Multer config in `lib/upload.ts`, `jwt.ts`.

## Phase 2 — End-to-end workflow walkthroughs

**BLOCKED** — requires a live DB connection, not available in this session.

## Phase 3 — Client wiring & convention compliance

- **CRITICAL — mock-auth backdoor**: `FIXED` (user confirmed 2026-07-12) — `client/src/contexts/AuthContext.tsx` `login()`/`signup()` catch any request failure (network error, server down — `!err.response`) and, instead of surfacing the error, **fabricate a fake logged-in user client-side**: role is inferred from the email string (`email.includes("admin") → ADMIN`, `"manager") → ASSET_MANAGER`, `"head") → DEPT_HEAD`, else `EMPLOYEE`), stored in `localStorage` under `assetflow_mock_user`, and `RequireAuth`/`RequireRole` accept it as a real session. `checkAuth()` on mount does the same fallback for `GET /auth/me`. This completely bypasses server-side auth/authorization whenever the backend is unreachable — anyone can get client-rendered ADMIN access by typing an email containing "admin" and having the request fail. Directly violates PROJECT_CONTEXT's "no self-assigned admin" / "role checked server-side on every mutation" guarantee (server-side enforcement is still intact — this is a client-side UI/routing bypass, not a data breach — but it's a bad look for a security-focused demo and masks real connectivity failures as successful logins). Removed the mock-user fallback entirely from `login`/`signup`/`checkAuth`/`logout` in `AuthContext.tsx` — failed requests now propagate as real errors instead of fabricating a session; also removed the now-pointless `localStorage` "assetflow_mock_user" persistence (session lives server-side via the JWT cookie, re-derived from `GET /auth/me` on mount, per spec).
- **Error message mismatch**: `FIXED` — `client/src/lib/api.ts`'s axios error interceptor read `error.response.data.message`, but the server's envelope is `{ ok: false, error }` (no `message` field) — every error toast/thrown-error across the whole app would have shown the generic "An unexpected error occurred" fallback instead of the real server-provided message (e.g. the 409 "currently held by {name}" / "slot overlaps" messages that are core demo features). Changed to read `.error`.
- Client typechecks cleanly (`tsc --noEmit`) after both fixes.
- **Pages with zero API wiring**: `BROKEN (needs decision)` — grepped every page for `useApiQuery`/`useApiMutation`/`api.` calls. Only **Allocations, Bookings, Audits** (all "R"-owned per the ownership map) are actually wired to `useQuery`/`useMutation` + `lib/api.ts`, matching every client convention. The other 9 routed pages have **no data-fetching calls at all** — they render hardcoded local `useState` mock arrays (`MOCK_ASSETS` etc.) and mutate only in-memory state on submit, nothing ever reaches the server:
  - `Assets.tsx` — hand-rolled `<table>` (not `DataTable`), hand-rolled modal (not `FormDialog`), no Zod/RHF, `MOCK_ASSETS` array, "Register Asset" just pushes into local state.
  - `Dashboard.tsx`, `OrgSetup.tsx`, `Maintenance.tsx`, `Notifications.tsx`, `ActivityLogs.tsx`, `Reports.tsx` — same pattern (confirmed via grep for `MOCK_`/local `useState` arrays and absence of `api.`/`useApiQuery`/`useApiMutation`); not yet read in full.
  - `Login.tsx`/`Signup.tsx` are themselves fine (they delegate to `useAuth()`), but that context is the broken piece above.
  - This contradicts PROJECT_CONTEXT's claim that "all domains implemented end-to-end" and "all pages exist and are routed" — routed, yes; wired, no, for 9 of 13.
- **`Placeholder.tsx`**: `FIXED` — confirmed unused in routing/imports elsewhere; deleted per the plan's instruction to remove genuinely-unused files.

**Scope note**: rewiring 9 pages to real API calls + shared components is a substantial build task, not a small fix — paused to get direction on priority/scope (user chose: rewire the 3 highest-value pages now — Assets, Maintenance, Dashboard — leave the rest logged).

- **`StatusBadge` colors**: `FIXED` — didn't match spec (architecture.md rule 7: AVAILABLE=green, ALLOCATED=blue, RESERVED=purple, UNDER_MAINTENANCE=amber, LOST/REJECTED=red, RETIRED/DISPOSED=gray, PENDING=amber, APPROVED/RESOLVED/VERIFIED=green). Old version used orange for UNDER_MAINTENANCE/PENDING and was missing RESERVED, RETIRED, MISSING, DAMAGED, CANCELLED, REQUESTED, UPCOMING, ONGOING, COMPLETED entirely (fell back to gray). Rewrote the color map to match the spec exactly and cover every enum value actually used across the app.
- **`Assets.tsx`**: `FIXED` — rewired from `MOCK_ASSETS` + hand-rolled table/modal to `useApiQuery`/`useApiMutation` + `DataTable`/`FormDialog`/`StatusBadge`/`PageHeader`/`EmptyState`, matching the `Allocations.tsx` pattern. Register/Edit gated to `ADMIN`/`ASSET_MANAGER` (matches server `authorize`). **Known gap**: photo upload (Multer) isn't wired in this form — the register/edit calls send JSON, not multipart, so `photoUrl` is never set from the UI even though the server supports it. Left out to keep this fix scoped; flagging for a follow-up.
- **`Maintenance.tsx`**: `FIXED` — rewired from a mock Kanban board to `DataTable` + `FormDialog`, wired to `GET /maintenance`, `POST /maintenance`, `/decide`, `/technician`, `/status`. **Design trade-off**: dropped the Kanban visual in favor of `DataTable` since shared-component conventions ("never hand-roll tables") take priority over preserving the original mock's bespoke layout; a Kanban isn't one of the six approved shared components. Someone can restore a nicer visual later using `DataTable` (or a new shared Kanban component) without touching the data layer.
- **`Dashboard.tsx`**: `FIXED` — rewired from fully hardcoded stats/activity to `GET /dashboard` (KPI cards) + `GET /activity-logs` (recent activity feed, first 8). **Known gap**: the original mock showed richer KPIs (overdue returns, active bookings, pending transfers, upcoming returns) that `GET /dashboard`'s service (`server/src/services/dashboard.ts`) doesn't currently compute — it only returns `totalAssets/allocated/underMaintenance/available`. Rather than inventing those numbers client-side, the dashboard now only shows what the API actually provides; extending `getDashboardKPIs()` to add overdue/bookings/transfers aggregates is a real Phase 4/backend task, not a client fix.
- **Still mock/unwired** (not touched this session, logged for later): `OrgSetup.tsx`, `Notifications.tsx`, `ActivityLogs.tsx`, `Reports.tsx` — same pattern as above (local `useState` mock arrays, no `useApiQuery`/`useApiMutation`, hand-rolled UI). `Reports.tsx`'s backend counterpart (`server/src/services/reports.ts`) is also itself a minimal stub (only `utilization`/`status` groupBy, everything else returns `{ message: 'Report type not implemented yet' }`), so that page needs backend work too, not just client wiring.
- Client typechecks cleanly (`tsc --noEmit -p tsconfig.json`) after all Phase 3 changes.

## Phase 4 — UX polish

(pending — requires running app)

## Phase 5 — Hardening & demo readiness

(pending)
