import React, { useState } from "react";
import {
  Package, Wrench, Download, AlertTriangle, CheckCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

// ── Mock Report Data ──────────────────────────────────────────────────────────

const utilizationByDept = [
  { dept: "IT",        available: 12, allocated: 28, maintenance: 3 },
  { dept: "Finance",   available: 8,  allocated: 15, maintenance: 1 },
  { dept: "HR",        available: 5,  allocated: 9,  maintenance: 0 },
  { dept: "Marketing", available: 4,  allocated: 12, maintenance: 2 },
  { dept: "Ops",       available: 14, allocated: 7,  maintenance: 4 },
];

const maintenanceFrequency = [
  { month: "Jan", requests: 4 },
  { month: "Feb", requests: 7 },
  { month: "Mar", requests: 3 },
  { month: "Apr", requests: 9 },
  { month: "May", requests: 5 },
  { month: "Jun", requests: 12 },
  { month: "Jul", requests: 6 },
];

const statusDistribution = [
  { name: "Available",    value: 52, color: "#10b981" },
  { name: "Allocated",    value: 35, color: "#3b82f6" },
  { name: "Maintenance",  value: 8,  color: "#f59e0b" },
  { name: "Reserved",     value: 9,  color: "#8b5cf6" },
  { name: "Retired",      value: 6,  color: "#6b7280" },
];

const mostUsedAssets = [
  { tag: "AF-0003", name: "Conference Room A",    bookings: 42 },
  { tag: "AF-0007", name: "Toyota Innova",         bookings: 31 },
  { tag: "AF-0009", name: "Canon EOS R5 Camera",   bookings: 28 },
  { tag: "AF-0004", name: "Epson Projector Pro",   bookings: 21 },
  { tag: "AF-0005", name: "MacBook Pro M2",         bookings: 17 },
];

const assetsDueForAudit = [
  { tag: "AF-0010", name: "Aeron Chair",       lastAudit: "2025-01-10", status: "OVERDUE" },
  { tag: "AF-0002", name: "HP LaserJet 5200",  lastAudit: "2025-03-22", status: "OVERDUE" },
  { tag: "AF-0006", name: "Logitech MX Keys",  lastAudit: "2025-06-01", status: "DUE_SOON" },
];

const SUMMARY_CARDS = [
  { label: "Total Assets",          value: "110",  sub: "+4 this month",  icon: Package,   color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { label: "Active Allocations",    value: "35",   sub: "across 4 depts", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Open Maintenance",      value: "5",    sub: "2 high priority", icon: Wrench,    color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { label: "Assets Due Audit",      value: "3",    sub: "overdue review",  icon: AlertTriangle, color: "text-red-400 bg-red-500/10 border-red-500/20" },
];

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#e2e8f0", fontSize: 12 },
  labelStyle: { color: "#94a3b8", fontWeight: 600 },
};

export const Reports: React.FC = () => {
  const [activeRange, setActiveRange] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live insights on asset utilization, maintenance trends, and audit health.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 gap-1">
            {(["7d","30d","90d"] as const).map((r) => (
              <button key={r} onClick={() => setActiveRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRange === r ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass-card p-5 rounded-2xl border ${card.color} flex flex-col gap-3`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{card.value}</div>
                <div className="text-sm font-semibold text-slate-300 mt-0.5">{card.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Utilization by Department - Bar */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6 lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-1">Asset Utilization by Department</h3>
          <p className="text-xs text-slate-500 mb-5">Available vs. Allocated vs. Maintenance breakdown per department.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={utilizationByDept} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="available"   name="Available"   fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="allocated"   name="Allocated"   fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution - Pie */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-1">Asset Status Split</h3>
          <p className="text-xs text-slate-500 mb-5">Current distribution across all status types.</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maintenance Frequency Line Chart */}
      <div className="glass-panel border border-slate-900 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-1">Maintenance Frequency</h3>
        <p className="text-xs text-slate-500 mb-5">Number of maintenance requests raised per month.</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={maintenanceFrequency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="requests" name="Requests" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-5">Most Booked Assets</h3>
          <div className="space-y-3">
            {mostUsedAssets.map((asset, i) => (
              <div key={asset.tag} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-black text-slate-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-200 truncate">{asset.name}</span>
                    <span className="text-xs font-bold text-blue-400 shrink-0 ml-2">{asset.bookings} times</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                      style={{ width: `${(asset.bookings / mostUsedAssets[0].bookings) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets Due for Audit */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-5">Assets Due for Audit</h3>
          {assetsDueForAudit.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">All assets are up to date ✅</div>
          ) : (
            <div className="space-y-3">
              {assetsDueForAudit.map((item) => (
                <div key={item.tag} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                      {item.tag}
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-500">Last: {new Intl.DateTimeFormat("en-IN").format(new Date(item.lastAudit))}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${
                    item.status === "OVERDUE"
                      ? "bg-red-500/10 text-red-400 border-red-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}>
                    {item.status === "OVERDUE" ? "Overdue" : "Due Soon"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
