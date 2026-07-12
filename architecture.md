# AssetFlow — Architecture (v4)

> Enterprise Asset & Resource Management System · 8-hour hackathon · Team of 3 (R, U, V)
> React SPA + Express REST API + MySQL. No BaaS, no MongoDB. One shared live MySQL database. Real-time notifications over Socket.io.

---

## 1. Tech Stack

### Frontend (React SPA — Vite)
React · TypeScript · Tailwind CSS · shadcn/ui · **TanStack Query** (server-state/caching) · React Router · **React Hook Form + Zod** (validated forms) · Recharts (reports) · **FullCalendar** (bookings) · **Socket.io client** (live notifications) · axios

### Backend (REST API)
Node · Express · TypeScript · **Prisma** (ORM + migrations) · **JWT** (jsonwebtoken) · **bcrypt** · **Socket.io** (real-time) · **Multer** (asset photo uploads)

### Database
**MySQL 8** (managed — e.g. Railway/Aiven/PlanetScale-style host, NOT a BaaS; we write the entire backend ourselves). One shared connection string = live DB for all three devs. Schema admin via **MySQL Workbench on U's machine**.

**Core principle: hard invariants live in MySQL where possible, workflows live in the Express service layer, React never contains business rules.**

---

## 2. Three-Layer Architecture (across two deployables)

```
  ┌───────────────────── CLIENT (React + Vite SPA) ─────────────────────────┐
  │  Pages: login/signup · dashboard · org-setup · assets · allocations ·   │
  │  bookings(FullCalendar) · maintenance · audits · reports ·              │
  │  notifications · logs                                                   │
  │  Data via TanStack Query hooks → axios. Live updates via Socket.io.     │
  └──────────────────────────────┬──────────────────────┬───────────────────┘
                     REST (JSON)  │                      │  WebSocket (events)
  ┌──────────────────────────────▼──────────────────────▼──── SERVER (Express) ─┐
  │  routes → requireAuth → authorize(roles) → controllers → SERVICES           │
  │  Services: state machines, approval chains, notify(), logActivity()         │
  │  Socket.io: on notify(), emit to room user:{id}. Multer: /assets uploads.   │
  └──────────────────────────────┬──────────────────────────────────────────────┘
                                  │ Prisma
  ┌──────────────────────────────▼──────────────── DATA (MySQL 8) ──────────────┐
  │  Enforced in DB: one-active-allocation (generated column + UNIQUE),         │
  │  FK integrity, enums. Enforced in a locking transaction: booking overlap.   │
  └──────────────────────────────────────────────────────────────────────────────┘
```

Auth: `POST /auth/login` → verify bcrypt → sign JWT `{ id, role, departmentId }` → httpOnly cookie. `requireAuth` verifies on every protected route; `authorize(roles)` checks the role. Socket connections authenticate with the same JWT and join room `user:{id}`. React only *hides* what a role can't do — the server *enforces* it.

---

## 3. Data Model (13 tables — Prisma models, MySQL)

### Master data
- **users** — id, name, email (unique), passwordHash, departmentId?, role enum(`ADMIN | ASSET_MANAGER | DEPT_HEAD | EMPLOYEE`), status
- **departments** — id, name, headId → users, parentId → departments, status
- **asset_categories** — id, name, customFields Json?, status

### Core
- **assets** — id, assetTag (auto `AF-0001`, UNIQUE), name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, photoUrl? (Multer upload path), isBookable, status enum(`AVAILABLE | ALLOCATED | RESERVED | UNDER_MAINTENANCE | LOST | RETIRED | DISPOSED`)

### Transactional
- **allocations** — id, assetId, employeeId, departmentId?, allocatedAt, expectedReturnDate?, returnedAt? (null = active), checkinCondition?, checkinNotes?
- **transfer_requests** — id, assetId, fromEmployeeId, toEmployeeId, reason, status enum(`REQUESTED | APPROVED | REJECTED`), approvedById?, decidedAt?
- **bookings** — id, assetId, bookedById, startTime, endTime, purpose, status enum(`UPCOMING | ONGOING | COMPLETED | CANCELLED`)
- **maintenance_requests** — id, assetId, raisedById, description, priority enum(`LOW | MEDIUM | HIGH`), photoUrl?, status enum(`PENDING | APPROVED | REJECTED | TECHNICIAN_ASSIGNED | IN_PROGRESS | RESOLVED`), technicianName?, approvedById?, resolvedAt?
- **audit_cycles** — id, name, departmentId?, location?, startDate, endDate, status enum(`OPEN | CLOSED`), createdById
- **audit_assignments** — id, cycleId, auditorId
- **audit_items** — id, cycleId, assetId, result enum(`PENDING | VERIFIED | MISSING | DAMAGED`), notes?, checkedById?, checkedAt?
- **notifications** — id, userId, type, title, body, link?, read, createdAt
- **activity_logs** — id, actorId, action, entityType, entityId, details Json?, createdAt

### MySQL-specific enforcement (added via raw SQL migration — Prisma can't express these)
```sql
-- Double-allocation: only ONE active (non-returned) allocation per asset.
-- Generated column is asset_id when active, NULL when returned; UNIQUE ignores NULLs.
ALTER TABLE allocations
  ADD COLUMN active_asset_id INT
    GENERATED ALWAYS AS (IF(returned_at IS NULL, asset_id, NULL)) STORED,
  ADD CONSTRAINT uq_one_active_allocation UNIQUE (active_asset_id);

-- Booking overlap: NO native exclusion constraint in MySQL.
-- Enforced in the createBooking service via a transaction:
--   START TRANSACTION;
--   SELECT ... FROM bookings WHERE asset_id = ? AND status <> 'CANCELLED'
--     AND start_time < :end AND end_time > :start FOR UPDATE;   -- locks the range
--   if any row returned -> reject; else INSERT; COMMIT;

-- Asset tag AF-0001: generated in the registerAsset service inside the transaction
--   (insert row, then UPDATE assets SET asset_tag = CONCAT('AF-', LPAD(id,4,'0')) WHERE id = :id)
--   because a MySQL trigger cannot modify the table it fires on.
```

---

## 4. API Contract (client/server coordination point — R publishes this first)

Base URL `/api`. Protected routes require the JWT cookie. Every response is `{ ok: true, data } | { ok: false, error }`.

| Method + path | Body / query | Auth | Purpose |
|---|---|---|---|
| POST /auth/signup | name, email, password | public | create EMPLOYEE account |
| POST /auth/login | email, password | public | login, set cookie, issue socket token |
| POST /auth/logout | — | auth | clear cookie |
| GET /auth/me | — | auth | current user + role |
| GET /assets | ?q&category&status&location | auth | list/search |
| POST /assets | multipart (fields + photo) | asset_manager+ | register (Multer, auto tag) |
| PATCH /assets/:id | multipart | asset_manager+ | edit |
| GET /assets/:id | — | auth | detail + histories |
| GET /allocations | ?tab=active\|history | auth | list |
| POST /allocations | assetId, employeeId, expectedReturnDate | asset_manager+ | allocate (409 on conflict → holder name) |
| POST /allocations/:id/return | condition, notes | asset_manager+ | return |
| GET /transfers | — | auth | list |
| POST /transfers | assetId, toEmployeeId, reason | auth | request transfer |
| POST /transfers/:id/decide | decision | asset_manager/dept_head | approve/reject |
| GET /bookings | ?assetId&from&to | auth | bookings for calendar |
| POST /bookings | assetId, startTime, endTime, purpose | auth | create (409 on overlap) |
| POST /bookings/:id/cancel | — | auth/owner | cancel |
| GET /maintenance | ?tab=all\|mine | auth | list |
| POST /maintenance | assetId, description, priority, photo | auth | raise (Multer optional) |
| POST /maintenance/:id/decide | decision | asset_manager+ | approve/reject |
| POST /maintenance/:id/technician | technicianName | asset_manager+ | assign |
| POST /maintenance/:id/status | status | asset_manager+ | start/resolve |
| GET /audits | — | auth | cycles |
| POST /audits | name, scope, dateRange, auditorIds | admin | create cycle (auto items) |
| POST /audits/:id/items/:itemId | result, notes | auditor | mark |
| POST /audits/:id/close | — | admin | close → missing become LOST |
| GET/POST/PATCH /org/departments | dept fields | admin | departments |
| GET/POST/PATCH /org/categories | category fields | admin | categories |
| GET /org/employees | — | admin | directory |
| POST /org/employees/:id/role | role | admin | **promote (only place roles change)** |
| GET /dashboard | — | auth | KPI aggregates |
| GET /reports/:type | — | auth | report aggregates |
| GET /notifications · POST /notifications/read · /read-all | — | auth | notifications |
| GET /activity-logs | ?actor&from&to | auth | logs |

**Socket.io events (server → client):** `notification:new` (payload = the notification) emitted to `user:{id}` whenever `notify()` runs. Client increments the bell + invalidates the notifications query. Optionally `dashboard:changed` to refetch KPIs live.

---

## 5. Business Rules → Enforcement Map (memorize for the demo)

| Requirement | Mechanism | Layer |
|---|---|---|
| No double-allocation | Generated column `active_asset_id` + `UNIQUE` | **DB constraint** |
| No overlapping bookings | Transaction with `SELECT ... FOR UPDATE` range-lock, then insert | **Service (atomic)** |
| No self-assigned admin | `/auth/signup` hard-codes EMPLOYEE; role changes only via `/org/employees/:id/role` behind `authorize(['ADMIN'])`; first admin seeded | **Service** |
| Maintenance approval before work | State machine: asset → UNDER_MAINTENANCE only on APPROVED, → AVAILABLE only on RESOLVED | **Service** |
| Auto status transitions | Asset status updated as a side-effect inside one Prisma `$transaction` | **Service** |
| Overdue returns flagged | Computed at read time (`expectedReturnDate < now() AND returnedAt IS NULL`) — no cron | **Query** |
| Transfer instead of conflict | Allocation on taken asset → unique violation caught → 409 with holder name → client shows Transfer button | **DB + service + client** |
| Audit discrepancy report | Query flagged audit_items; closing sets confirmed-missing to LOST | **Query + service** |
| Every action logged | `logActivity()` in every mutating service | **Service** |
| Notifications on events | `notify()` writes a row AND emits `notification:new` over Socket.io | **Service + real-time** |

Error mapping in controllers: Prisma `P2002` on `uq_one_active_allocation` → 409 "currently held by {name}"; overlap check failure → 409 "slot overlaps an existing booking".

---

## 6. The Three State Machines

Asset status NEVER changes directly — only as a side effect of workflow services.

### Asset lifecycle
```
                    allocate            return
        ┌────────────────────► ALLOCATED ─────────────┐
        │                                             ▼
   AVAILABLE ◄──────────────────────────────── AVAILABLE
        │  maintenance approved      resolved         ▲
        ├────────────────────► UNDER_MAINTENANCE ─────┘
        │  booking starts (bookable) → RESERVED
        │  audit confirms missing → LOST
        └─ admin action → RETIRED / DISPOSED   (terminal)
```

### Maintenance
```
PENDING ──► APPROVED ──► TECHNICIAN_ASSIGNED ──► IN_PROGRESS ──► RESOLVED
   └──────► REJECTED     (asset → UNDER_MAINTENANCE on APPROVED, → AVAILABLE on RESOLVED)
```

### Transfer
```
REQUESTED ──► APPROVED ──► old allocation closed + new allocation inserted (history preserved)
     └──────► REJECTED
```

---

## 7. Roles & Permissions

| Capability | Employee | Dept Head | Asset Manager | Admin |
|---|:-:|:-:|:-:|:-:|
| View own allocations / raise maintenance / book / request return-transfer | ✅ | ✅ | ✅ | ✅ |
| View department assets, approve dept transfers | | ✅ | ✅ | ✅ |
| Register assets, allocate, approve transfers/maintenance/returns | | | ✅ | ✅ |
| Org setup (departments, categories, role promotion), audit cycles, org analytics | | | | ✅ |

Signup → always EMPLOYEE. Promotion only via `/org/employees/:id/role` (admin). `prisma/seed.ts` creates 1 admin, 1 asset manager, 2 dept heads, 4 employees (password `Password123!`), 4 departments, 5 categories, ~18 assets, active+overdue+returned allocations, bookings, mixed maintenance, one open audit cycle.

---

## 8. Folder Structure & Ownership (zero-merge-conflict plan)

```
/server                              ← R owns almost entirely
  /prisma  schema.prisma · /migrations · seed.ts
  /uploads                           (Multer asset photos, git-ignored)
  /src
    index.ts   (express + socket.io bootstrap)
    /lib       prisma.ts · jwt.ts · socket.ts · logActivity.ts · notify.ts · upload.ts(Multer)
    /middleware  requireAuth.ts · authorize.ts · errorHandler.ts
    /routes    one file per domain
    /controllers  thin (validate with Zod, call service, map errors)
    /services     business logic + state machines
/client                              ← R sets up shell; U/V own pages
  /src
    main.tsx · App.tsx (router + QueryClientProvider + SocketProvider)
    /lib       api.ts (axios) · queryClient.ts · socket.ts · AuthContext.tsx
    /hooks     TanStack Query hooks per domain (useAssets, useBookings, ...)
    /components/ui      (shadcn)                                   ← R installs
    /components/shared  DataTable · FormDialog · StatusBadge ·
                        ConfirmDialog · EmptyState · PageHeader     ← R
    /pages
      Login · Signup                                              ← U
      AppLayout (shell + nav + live bell)                         ← U
      Dashboard                                                   ← U
      OrgSetup                                                    ← U
      Assets                                                      ← V
      Allocations                                                 ← R
      Bookings (FullCalendar)                                     ← R
      Maintenance                                                 ← V
      Audits                                                      ← R
      Reports                                                     ← V
      Notifications · ActivityLogs                                ← V
/shared    zod schemas shared client+server (optional)            ← R
ARCHITECTURE.md · PROJECT_CONTEXT.md · ROADMAP.md · TEAM_PROMPTS.md
```

Branches: `main`, `r-core`, `u-ui`, `v-modules`. Merge at Checkpoint A (after core screens) and Checkpoint B (after workflows).
**Live DB workflow:** one MySQL connection string in `/server/.env`; only R runs `prisma migrate`; U/V run `npx prisma generate` after pulling schema changes. Workbench (U's machine) is the DB admin/inspection tool. The client never touches Prisma — only the API.

---

## 9. Why This Wins (judge-facing talking points)

1. **Correctness under concurrency** — double-allocation blocked by a DB unique constraint; booking overlap blocked by a row-locking transaction. Live demo: two tabs, try to double-book, it's rejected.
2. **Real hand-built backend, no BaaS** — JWT auth (bcrypt + jsonwebtoken), an authorize-guarded service layer, versioned Prisma migrations, file uploads via Multer, a clean documented REST API.
3. **Real-time UX** — Socket.io pushes notifications the instant an event fires; the bell updates without a refresh.
4. **Realistic security** — no self-assigned admin; role checked server-side on every mutation; explicit promotion flow.
5. **Complete workflows, not CRUD** — transfer approval, maintenance approval gates, audit cycles with auto discrepancy reports, full status history, a real booking calendar (FullCalendar).
6. **Seeded, living demo** — judges see a populated org immediately.