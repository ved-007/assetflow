import React from "react";
import {
  ShieldAlert,
  PlusCircle,
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  Laptop,
  CheckCircle,
  Wrench,
  Clock,
  ExternalLink
} from "lucide-react";

export const Dashboard: React.FC = () => {
  // Mock overview data
  const stats = [
    { label: "Available Assets", value: 128, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Allocated Assets", value: 35, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: "Overdue Returns", value: 4, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    { label: "Active Bookings", value: 9, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { label: "Pending Transfers", value: 3, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { label: "Upcoming Returns", value: 12, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "allocation",
      message: "Laptop AF-0114 allocated to Priya Shah",
      dept: "IT Department",
      time: "Just now",
      icon: Laptop,
      iconColor: "text-blue-400 bg-blue-500/10"
    },
    {
      id: 2,
      type: "booking",
      message: "Room 302 booking confirmed (2:00 PM to 3:00 PM)",
      dept: "HR Department",
      time: "2 hours ago",
      icon: CalendarDays,
      iconColor: "text-purple-400 bg-purple-500/10"
    },
    {
      id: 3,
      type: "maintenance",
      message: "Projector AF-0062 maintenance completed",
      dept: "Facilities",
      time: "5 hours ago",
      icon: Wrench,
      iconColor: "text-emerald-400 bg-emerald-500/10"
    },
    {
      id: 4,
      type: "return",
      message: "iPad AF-0099 returned in good condition",
      dept: "Sales Department",
      time: "Yesterday",
      icon: CheckCircle,
      iconColor: "text-slate-400 bg-slate-500/10"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Today's Overview</h1>
          <p className="text-slate-400 text-sm">Real-time status of company devices, resources, and bookings.</p>
        </div>
        <div className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto">
          Last sync: Just now
        </div>
      </div>

      {/* Alert Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-red-950/20 to-transparent border border-red-500/25 flex items-start gap-4">
        <div className="p-2 bg-red-500/15 border border-red-500/20 rounded-xl text-red-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">4 Assets Overdue for Return</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Several allocations have passed their expected return date. Team leads have been notified to initiate returns.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between h-28 glass-card transition-all duration-200`}
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            <span className={`text-3xl font-black ${stat.color.split(" ")[0]}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Quick Operations</h3>
            <p className="text-xs text-slate-400 mb-6">Common operations for assets and resource allocations.</p>
            <div className="space-y-3">
              <button
                onClick={() => alert("Action: Register Asset Dialog (Assigned to Role V)")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900/60 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      Register Asset
                    </span>
                    <span className="text-[10px] text-slate-500">Record a new physical asset</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => alert("Action: Book Resource Calendar (Assigned to Role R)")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                      Book Resource
                    </span>
                    <span className="text-[10px] text-slate-500">Reserve rooms, vehicles, spaces</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => alert("Action: Raise Request Dialog (Assigned to Role V)")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/60 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                      Raise Request
                    </span>
                    <span className="text-[10px] text-slate-500">Create maintenance or transfer request</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-blue-950/20 border border-blue-900/20 text-xs text-blue-400/80">
            <span className="font-bold text-white block mb-1">Hackathon Note</span>
            Vite Frontend dashboard linked directly with prisma entities. Register, booking, and requests map to unified status machines.
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-panel border border-slate-900 rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-xs text-slate-400">Log of activities and lifecycle mutations.</p>
            </div>
            <button
              onClick={() => alert("Navigate to full logs page (Assigned to Role V)")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
            >
              View Full Logs <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900/60 transition-all duration-150"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl border border-white/5 ${act.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-200 truncate">{act.message}</span>
                      <span className="block text-xs text-slate-500 font-medium">{act.dept}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
