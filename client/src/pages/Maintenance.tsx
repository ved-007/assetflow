import React, { useState } from "react";
import {
  Plus, Wrench, X, AlertTriangle, Clock, CheckCircle, Loader2, UserCheck
} from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

interface MaintenanceRequest {
  id: number;
  assetTag: string;
  assetName: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  raisedBy: string;
  technicianName?: string;
  reportedDate: string;
  resolvedAt?: string;
  remarks?: string;
}

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  LOW:    { label: "Low",    color: "bg-slate-500/10 text-slate-400 border-slate-500/25" },
  MEDIUM: { label: "Medium", color: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  HIGH:   { label: "High",   color: "bg-red-500/10 text-red-400 border-red-500/25" },
};

const COLUMNS: { status: MaintenanceStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: "PENDING",            label: "Pending",             icon: <Clock className="w-4 h-4" />,       color: "border-amber-500/30 bg-amber-500/5" },
  { status: "APPROVED",           label: "Approved",            icon: <CheckCircle className="w-4 h-4" />, color: "border-blue-500/30 bg-blue-500/5" },
  { status: "TECHNICIAN_ASSIGNED",label: "Tech Assigned",       icon: <UserCheck className="w-4 h-4" />,   color: "border-purple-500/30 bg-purple-500/5" },
  { status: "IN_PROGRESS",        label: "In Progress",         icon: <Loader2 className="w-4 h-4" />,     color: "border-indigo-500/30 bg-indigo-500/5" },
  { status: "RESOLVED",           label: "Resolved",            icon: <CheckCircle className="w-4 h-4" />, color: "border-emerald-500/30 bg-emerald-500/5" },
];

const MOCK_REQUESTS: MaintenanceRequest[] = [
  { id: 1, assetTag: "AF-0004", assetName: "Epson Projector Pro",   description: "Lamp flickers, needs replacement",          priority: "HIGH",   status: "IN_PROGRESS",         raisedBy: "Priya Shah",  technicianName: "Rajesh K.", reportedDate: "2026-07-08" },
  { id: 2, assetTag: "AF-0001", assetName: "Dell XPS 15 Laptop",    description: "Battery drains in 1hr, hardware fault",      priority: "HIGH",   status: "PENDING",             raisedBy: "Rohan Mehta", reportedDate: "2026-07-11" },
  { id: 3, assetTag: "AF-0002", assetName: "HP LaserJet 5200",      description: "Paper jam sensor not working consistently",  priority: "MEDIUM", status: "TECHNICIAN_ASSIGNED", raisedBy: "Arjun Dev",   technicianName: "Suresh M.", reportedDate: "2026-07-09" },
  { id: 4, assetTag: "AF-0006", assetName: "Logitech MX Keys",      description: "Several keys not registering inputs",        priority: "LOW",    status: "APPROVED",            raisedBy: "Sameer Iqbal", reportedDate: "2026-07-10" },
  { id: 5, assetTag: "AF-0008", assetName: "LG 27\" 4K Monitor",    description: "Dead pixels in top-right corner cluster",   priority: "MEDIUM", status: "RESOLVED",            raisedBy: "Priya Shah",  technicianName: "Vikram P.", reportedDate: "2026-07-03", resolvedAt: "2026-07-07", remarks: "Panel replaced under warranty." },
  { id: 6, assetTag: "AF-0007", assetName: "Toyota Innova",         description: "Brake pads worn, requires servicing",       priority: "HIGH",   status: "PENDING",             raisedBy: "Rohan Mehta", reportedDate: "2026-07-12" },
];

export const Maintenance: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(MOCK_REQUESTS);
  const [showRaise, setShowRaise]   = useState(false);
  const [selectedCard, setSelectedCard] = useState<MaintenanceRequest | null>(null);

  const [form, setForm] = useState({ assetTag: "", assetName: "", description: "", priority: "MEDIUM" as Priority });

  const handleRaise = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: MaintenanceRequest = {
      id: requests.length + 1,
      assetTag: form.assetTag,
      assetName: form.assetName,
      description: form.description,
      priority: form.priority,
      status: "PENDING",
      raisedBy: "You (Current User)",
      reportedDate: new Date().toISOString().split("T")[0],
    };
    setRequests([newReq, ...requests]);
    setShowRaise(false);
    setForm({ assetTag: "", assetName: "", description: "", priority: "MEDIUM" });
  };

  const advanceStatus = (id: number) => {
    const order: MaintenanceStatus[] = ["PENDING","APPROVED","TECHNICIAN_ASSIGNED","IN_PROGRESS","RESOLVED"];
    setRequests(requests.map((r) => {
      if (r.id !== id) return r;
      const idx = order.indexOf(r.status);
      const nextStatus = idx < order.length - 1 ? order[idx + 1] : r.status;
      return { ...r, status: nextStatus, ...(nextStatus === "RESOLVED" ? { resolvedAt: new Date().toISOString().split("T")[0] } : {}) };
    }));
    setSelectedCard(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Maintenance Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track, approve, and resolve maintenance requests — approval workflow with Kanban board.</p>
        </div>
        <button
          onClick={() => setShowRaise(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all self-start sm:self-auto border border-blue-400/20"
        >
          <Plus className="w-4 h-4" /> Raise Request
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const cards = requests.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className={`rounded-2xl border p-4 min-h-[280px] flex flex-col gap-3 ${col.color}`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                  {col.icon} {col.label}
                </div>
                <span className="text-xs font-black text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {cards.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-medium">
                  No requests
                </div>
              ) : (
                cards.map((req) => {
                  const pm = PRIORITY_META[req.priority];
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedCard(req)}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-left hover:border-slate-700 hover:bg-slate-900 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs text-blue-400 font-bold">{req.assetTag}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${pm.color}`}>
                          {pm.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{req.assetName}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{req.description}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[10px] text-slate-600">{req.raisedBy}</span>
                        {req.technicianName && (
                          <span className="text-[10px] text-purple-400 font-semibold">👷 {req.technicianName}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" /> Maintenance Request #{selectedCard.id}
              </h3>
              <button onClick={() => setSelectedCard(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  {selectedCard.assetTag}
                </span>
                <span className="font-bold text-white">{selectedCard.assetName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${PRIORITY_META[selectedCard.priority].color}`}>
                  {PRIORITY_META[selectedCard.priority].label} Priority
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-800 text-slate-300 border-slate-700 uppercase">
                  {selectedCard.status.replace("_", " ")}
                </span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed border border-slate-800">
                {selectedCard.description}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div><span className="text-slate-600 block mb-0.5">Raised By</span><span className="text-slate-200 font-semibold">{selectedCard.raisedBy}</span></div>
                <div><span className="text-slate-600 block mb-0.5">Reported</span><span className="text-slate-200 font-semibold">{selectedCard.reportedDate}</span></div>
                {selectedCard.technicianName && (
                  <div><span className="text-slate-600 block mb-0.5">Technician</span><span className="text-purple-400 font-semibold">{selectedCard.technicianName}</span></div>
                )}
                {selectedCard.resolvedAt && (
                  <div><span className="text-slate-600 block mb-0.5">Resolved On</span><span className="text-emerald-400 font-semibold">{selectedCard.resolvedAt}</span></div>
                )}
              </div>
              {selectedCard.remarks && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400">
                  <span className="font-bold block mb-1">Remarks</span>{selectedCard.remarks}
                </div>
              )}
              {selectedCard.status !== "RESOLVED" && selectedCard.status !== "REJECTED" && (
                <button
                  onClick={() => advanceStatus(selectedCard.id)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
                >
                  Advance to next stage →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise Request Modal */}
      {showRaise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Raise Maintenance Request
              </h3>
              <button onClick={() => setShowRaise(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRaise} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Asset Tag *</label>
                <input required value={form.assetTag} onChange={(e) => setForm({...form, assetTag: e.target.value})}
                  placeholder="e.g. AF-0004"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Asset Name *</label>
                <input required value={form.assetName} onChange={(e) => setForm({...form, assetName: e.target.value})}
                  placeholder="e.g. Epson Projector Pro"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Issue Description *</label>
                <textarea required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  rows={3} placeholder="Describe the issue clearly..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value as Priority})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowRaise(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg transition-colors">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
