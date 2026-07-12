# AssetFlow — PROJECT CONTEXT (v5)

> **Paste this file at the start of every AI coding session. It keeps all three developers' generated code consistent.**

## Current status (as of 2026-07-12)

Full-stack scaffold is complete and feature-built out on both sides; polish/testing is what remains.

- **Server (`/server`):** all domains implemented end-to-end (route → controller → service) — Auth, Org, Assets, Allocations, Transfers, Bookings, Maintenance, Audits, Dashboard, Reports, Notifications, ActivityLogs. Shared infra in place: `requireAuth`/`authorize` middleware, `errorHandler`, `logActivity`, `notify` (DB + Socket.io), Multer upload, JWT cookie auth, Prisma client, Socket.io server.
- **Client (`/client`):** all pages exist and are routed in `App.tsx` (Login, Signup, Dashboard, OrgSetup, Assets, Maintenance, Reports, Notifications, ActivityLogs, Allocations, Bookings, Audits) behind `RequireAuth` + `SocketProvider` + `AppLayout`. Shared components (`DataTable`, `FormDialog`, `StatusBadge`, `ConfirmDialog`, `EmptyState`, `PageHeader`), `AuthContext`, `ThemeContext`, `lib/api.ts`, `lib/socket.ts`, `lib/queryClient.ts`, and `hooks/useApi.ts` are all built. `Placeholder.tsx` still exists but is unused in routing.
- **Database:** Prisma schema + MySQL migrations already applied (per commit "Added MySQL database and Prisma setup").
- **Git:** last commit `4eab571` "Implement Auth, Allocations, Bookings, Audits" on `main`; working tree clean.
- **Not yet verified:** no evidence of automated tests; UI has not been walked through end-to-end in a browser recently. Treat remaining work as verification/bug-fixing and UX polish rather than net-new feature building, unless told otherwise.

## What we are building

AssetFlow: an Enterprise Asset & Resource Management System for an 8-hour hackathon. Organizations track physical assets (laptops, vehicles, rooms) through their lifecycle: allocation with conflict prevention, time-slot booking with overlap rejection, maintenance approval workflows, audit cycles with discrepancy reports, real-time notifications, and role-based access (Admin / Asset Manager / Dept Head / Employee).

## Stack (do not deviate — no BaaS, no MongoDB, NOT Next.js)

- **Client:** React + Vite + TypeScript, React Router, Tailwind + shadcn/ui, **TanStack Query** (all server state), **React Hook Form + Zod** (forms), Recharts, **FullCalendar** (bookings), **Socket.io client** (live notifications), axios.
- **Server:** Node + Express + TypeScript, Prisma ORM, JWT (jsonwebtoken) + bcrypt, **Socket.io**, **Multer** (asset photo uploads).
- **Database:** MySQL 8. `DATABASE_URL` in `/server/.env`. Only R runs `prisma migrate`. Admin/inspect via MySQL Workbench on U's machine.
- **Auth:** JWT in an httpOnly cookie; payload `{ id, role, departmentId }`.
- Two folders in one repo: `/client` and `/server`. The client NEVER imports Prisma or hits the DB — it only calls the REST API (via TanStack Query hooks → `src/lib/api.ts` axios instance, `withCredentials: true`) and subscribes to Socket.io.
- NO Next.js, NO Supabase/Firebase/Mongo, NO Redux/tRPC.

## Server conventions (non-negotiable)

1. **Route → middleware → controller → service.** Controllers are thin: validate with Zod, call the service, map errors to HTTP + JSON. Services hold ALL business logic.
2. **Every mutating service** must: run only after `requireAuth` + `authorize([...roles])`; update related asset status in the same `prisma.$transaction` (state-machine side-effects); call `logActivity(actorId, action, entityType, entityId, details)`; call `notify(userId, type, title, body, link)` where an event warrants it.
3. `notify()` both writes a notification row AND emits Socket.io `notification:new` to room `user:{userId}`.
4. **Asset status is NEVER set from a raw client value.** It changes only as a side effect of allocate / return / booking / maintenance / audit services.
5. **MySQL enforcement facts:**

- Double-allocation: generated column `active_asset_id = IF(returned_at IS NULL, asset_id, NULL)` + `UNIQUE`. Catch Prisma `P2002` on it → look up holder → 409 "This asset is currently held by {name}".
- Booking overlap: NO DB constraint. In `createBooking`, inside a transaction, `SELECT ... FOR UPDATE` the asset's non-cancelled bookings where `start_time < :end AND end_time > :start`; if any exist reject with 409 "This slot overlaps an existing booking"; else insert.
- Asset tag `AF-0001`: in `registerAsset`, insert then `UPDATE assets SET asset_tag = CONCAT('AF-', LPAD(id,4,'0'))` (a trigger can't modify its own table in MySQL).
6. **Every response** is `{ ok: true, data } | { ok: false, error: string }`. A shared `errorHandler` is the last resort.
7. Signup route hard-codes `role: 'EMPLOYEE'`. Role changes only via `POST /org/employees/:id/role` behind `authorize(['ADMIN'])`.
8. File uploads via Multer to `/server/uploads`, served statically; store the path in `photoUrl`.

## Client conventions (non-negotiable)

1. **All server state via TanStack Query** — `useQuery` for reads, `useMutation` for writes with `queryClient.invalidateQueries` on success. No `useEffect` fetching. Query hooks live in `src/hooks/`.
2. Under the hood, hooks call `src/lib/api.ts` (axios, `withCredentials`). No scattered `fetch`.
3. Auth state in `AuthContext` (from `GET /auth/me`); protected routes redirect to `/login`; UI hides actions a role can't perform (server still enforces).
4. Socket.io: a `SocketProvider` connects after auth, joins the user room, and on `notification:new` invalidates the notifications query + bumps the bell.
5. **Reuse shared components** from `src/components/shared/`: `DataTable`, `FormDialog`, `StatusBadge`, `ConfirmDialog`, `EmptyState`, `PageHeader`. Forms use React Hook Form + Zod. Never hand-roll tables or modals.
6. Bookings UI uses **FullCalendar** (timeGrid/day view) — booking blocks are events; clicking an empty slot opens the create dialog.
7. **Status colors** via `StatusBadge`: AVAILABLE=green, ALLOCATED=blue, RESERVED=purple, UNDER_MAINTENANCE=amber, LOST/REJECTED=red, RETIRED/DISPOSED=gray, PENDING=amber, APPROVED/RESOLVED/VERIFIED=green.
8. Dates via `Intl.DateTimeFormat('en-IN')`. Currency INR. Every page: loading skeleton + empty state + error toast (sonner). Mobile-responsive (sidebar → Sheet).

## Database facts (already decided — do not redesign)

- Models: User, Department, AssetCategory, Asset, Allocation, TransferRequest, Booking, MaintenanceRequest, AuditCycle, AuditAssignment, AuditItem, Notification, ActivityLog. Int autoincrement PKs (keeps the generated column + asset-tag simple in MySQL).
- Role enum: `ADMIN | ASSET_MANAGER | DEPT_HEAD | EMPLOYEE`. Asset status: `AVAILABLE | ALLOCATED | RESERVED | UNDER_MAINTENANCE | LOST | RETIRED | DISPOSED`.
- "Overdue" computed at read time; no cron.
- Maintenance: PENDING → APPROVED/REJECTED → TECHNICIAN_ASSIGNED → IN_PROGRESS → RESOLVED (asset → UNDER_MAINTENANCE on APPROVED, → AVAILABLE on RESOLVED).
- Transfer: REQUESTED → APPROVED/REJECTED (approve closes old allocation, inserts new, one transaction).
- Audit: admin creates cycle (scope+dates) → auto-generate audit_items for in-scope assets → auditors mark VERIFIED/MISSING/DAMAGED → discrepancy report = flagged items → close sets confirmed-missing to LOST and locks the cycle.

## API contract

See ARCHITECTURE.md §4 for the full endpoint + Socket.io event list. This is the contract between R's server and U/V's client — build against it. If a shape is unclear, ask R, don't invent it.

## Team ownership (only touch your own folders)

- **R** (`r-core`): all of `/server`; `/client` lib (api, queryClient, socket, AuthContext) + shared components + hooks; Allocations, Bookings, Audits pages.
- **U** (`u-ui`): `/client` Login, Signup, AppLayout (shell + live bell), Dashboard, OrgSetup.
- **V** (`v-modules`): `/client` Assets, Maintenance, Notifications, ActivityLogs, Reports.

## When generating code with AI

- Give the AI this file + the relevant ARCHITECTURE.md section (especially §4 API contract) first.
- Ask for COMPLETE files, one per screen/domain. Import helpers/hooks from `lib/` and `hooks/` — never redefine them.
