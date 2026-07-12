import React, { useState } from "react";
import {
  Search, User, Package, Shuffle,
  Wrench, CalendarDays, ClipboardCheck, Shield,
  Settings, ChevronDown
} from "lucide-react";

type Module = "ASSET" | "ALLOCATION" | "TRANSFER" | "MAINTENANCE" | "BOOKING" | "AUDIT" | "USER" | "SYSTEM";

interface ActivityLog {
  id: number;
  actor: string;
  actorRole: string;
  action: string;
  module: Module;
  description: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

const MODULE_META: Record<Module, { label: string; icon: React.ReactNode; color: string }> = {
  ASSET:       { label: "Asset",       icon: <Package className="w-3.5 h-3.5" />,       color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  ALLOCATION:  { label: "Allocation",  icon: <User className="w-3.5 h-3.5" />,           color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  TRANSFER:    { label: "Transfer",    icon: <Shuffle className="w-3.5 h-3.5" />,        color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  MAINTENANCE: { label: "Maintenance", icon: <Wrench className="w-3.5 h-3.5" />,         color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  BOOKING:     { label: "Booking",     icon: <CalendarDays className="w-3.5 h-3.5" />,   color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  AUDIT:       { label: "Audit",       icon: <ClipboardCheck className="w-3.5 h-3.5" />, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  USER:        { label: "User",        icon: <Shield className="w-3.5 h-3.5" />,         color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  SYSTEM:      { label: "System",      icon: <Settings className="w-3.5 h-3.5" />,       color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const MOCK_LOGS: ActivityLog[] = [
  { id: 1,  actor: "Rohan Mehta",  actorRole: "ASSET_MANAGER", action: "ALLOCATED",       module: "ALLOCATION",  description: "Allocated AF-0001 (Dell XPS 15) to Priya Shah",             entityType: "Allocation",  entityId: "ALLOC-021", createdAt: "2026-07-12T09:30:00" },
  { id: 2,  actor: "Priya Shah",   actorRole: "DEPT_HEAD",     action: "RAISED_REQUEST",  module: "MAINTENANCE", description: "Raised maintenance request for AF-0006 (Logitech MX Keys)",  entityType: "Maintenance", entityId: "MAINT-011", createdAt: "2026-07-12T08:15:00" },
  { id: 3,  actor: "Arjun Dev",    actorRole: "EMPLOYEE",      action: "BOOKED",          module: "BOOKING",     description: "Booked Conference Room A from 2:00 PM to 4:00 PM",          entityType: "Booking",     entityId: "BOOK-034",  createdAt: "2026-07-12T07:45:00" },
  { id: 4,  actor: "Rohan Mehta",  actorRole: "ASSET_MANAGER", action: "APPROVED",        module: "MAINTENANCE", description: "Approved maintenance request MAINT-011",                    entityType: "Maintenance", entityId: "MAINT-011", createdAt: "2026-07-11T17:00:00" },
  { id: 5,  actor: "Admin User",   actorRole: "ADMIN",         action: "REGISTERED",      module: "ASSET",       description: "Registered new asset AF-0009 (Canon EOS R5 Camera)",       entityType: "Asset",       entityId: "AF-0009",   createdAt: "2026-07-11T14:30:00" },
  { id: 6,  actor: "Sameer Iqbal", actorRole: "EMPLOYEE",      action: "REQUESTED",       module: "TRANSFER",    description: "Raised transfer request for AF-0008 to Arjun Dev",          entityType: "Transfer",    entityId: "TRF-009",   createdAt: "2026-07-11T11:20:00" },
  { id: 7,  actor: "Rohan Mehta",  actorRole: "ASSET_MANAGER", action: "APPROVED",        module: "TRANSFER",    description: "Approved transfer TRF-009 for AF-0008 (LG 4K Monitor)",    entityType: "Transfer",    entityId: "TRF-009",   createdAt: "2026-07-11T12:45:00" },
  { id: 8,  actor: "Admin User",   actorRole: "ADMIN",         action: "PROMOTED",        module: "USER",        description: "Changed Sameer Iqbal's role to DEPT_HEAD",                 entityType: "User",        entityId: "USR-004",   createdAt: "2026-07-10T16:00:00" },
  { id: 9,  actor: "Priya Shah",   actorRole: "DEPT_HEAD",     action: "RETURNED",        module: "ALLOCATION",  description: "Asset AF-0003 returned in GOOD condition",                 entityType: "Allocation",  entityId: "ALLOC-018", createdAt: "2026-07-10T10:00:00" },
  { id: 10, actor: "Admin User",   actorRole: "ADMIN",         action: "CYCLE_CREATED",   module: "AUDIT",       description: "Created Audit Cycle Q2-2026 covering 40 assets",           entityType: "AuditCycle",  entityId: "AUDIT-002", createdAt: "2026-07-09T09:00:00" },
  { id: 11, actor: "Arjun Dev",    actorRole: "EMPLOYEE",      action: "MARKED",          module: "AUDIT",       description: "Marked AF-0010 (Aeron Chair) as MISSING in audit Q2-2026", entityType: "AuditItem",   entityId: "AUDIT-002", createdAt: "2026-07-09T14:20:00" },
  { id: 12, actor: "System",       actorRole: "SYSTEM",        action: "FLAGGED_OVERDUE", module: "SYSTEM",      description: "AF-0001 allocation marked OVERDUE (past expected return)",  entityType: "Allocation",  entityId: "ALLOC-021", createdAt: "2026-07-12T00:01:00" },
];

const ALL_MODULES: ("ALL" | Module)[] = ["ALL", "ASSET", "ALLOCATION", "TRANSFER", "MAINTENANCE", "BOOKING", "AUDIT", "USER", "SYSTEM"];

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60)   return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)     return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const ActivityLogs: React.FC = () => {
  const [search, setSearch]       = useState("");
  const [moduleFilter, setModuleFilter] = useState<"ALL" | Module>("ALL");

  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch = log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "ALL" || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Activity Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Immutable chronological record of every action performed across the system.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, action, or description…"
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as any)}
            className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 pl-4 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {ALL_MODULES.map((m) => (
              <option key={m} value={m}>
                {m === "ALL" ? "All Modules" : MODULE_META[m].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Timeline Log */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-800" />

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm glass-panel border border-slate-900 rounded-3xl">
              No log entries match your filters.
            </div>
          ) : (
            filtered.map((log) => {
              const meta = MODULE_META[log.module];
              return (
                <div key={log.id} className="flex gap-4 relative">
                  {/* Module icon dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 z-10 ${meta.color}`}>
                    {meta.icon}
                  </div>

                  {/* Log card */}
                  <div className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 hover:bg-slate-900/60 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Module badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                        {/* Action badge */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        {/* Entity ID */}
                        <span className="font-mono text-[10px] text-slate-500">{log.entityId}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-semibold shrink-0">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{log.description}</p>

                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">
                        {log.actor.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-300 font-semibold">{log.actor}</span>
                        {" "}·{" "}
                        <span className="text-[10px] text-slate-600 uppercase tracking-wide">
                          {log.actorRole.replace("_", " ")}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-700 ml-auto hidden sm:block">
                        {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
