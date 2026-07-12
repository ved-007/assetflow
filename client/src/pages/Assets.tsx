import React, { useState } from "react";
import {
  Search, Plus, Package, Tag, MapPin, X, ChevronDown
} from "lucide-react";

type AssetStatus = "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";
type AssetCondition = "NEW" | "GOOD" | "FAIR" | "POOR";

interface Asset {
  id: number;
  assetTag: string;
  name: string;
  category: string;
  serialNumber: string;
  location: string;
  status: AssetStatus;
  condition: AssetCondition;
  acquisitionDate: string;
  acquisitionCost: number;
  isBookable: boolean;
}

const STATUS_META: Record<AssetStatus, { label: string; color: string }> = {
  AVAILABLE:         { label: "Available",         color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  ALLOCATED:         { label: "Allocated",          color: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
  RESERVED:          { label: "Reserved",           color: "bg-purple-500/10 text-purple-400 border-purple-500/25" },
  UNDER_MAINTENANCE: { label: "Under Maintenance",  color: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  LOST:              { label: "Lost",               color: "bg-red-500/10 text-red-400 border-red-500/25" },
  RETIRED:           { label: "Retired",            color: "bg-slate-500/10 text-slate-400 border-slate-500/25" },
  DISPOSED:          { label: "Disposed",           color: "bg-slate-500/10 text-slate-500 border-slate-600/25" },
};

const CONDITION_META: Record<AssetCondition, { label: string; color: string }> = {
  NEW:  { label: "New",  color: "text-emerald-400" },
  GOOD: { label: "Good", color: "text-blue-400" },
  FAIR: { label: "Fair", color: "text-amber-400" },
  POOR: { label: "Poor", color: "text-red-400" },
};

const MOCK_ASSETS: Asset[] = [
  { id: 1,  assetTag: "AF-0001", name: "Dell XPS 15 Laptop",      category: "Laptops",      serialNumber: "SN-DX15-001", location: "IT Dept – Floor 2", status: "ALLOCATED",         condition: "GOOD", acquisitionDate: "2023-01-15", acquisitionCost: 85000, isBookable: false },
  { id: 2,  assetTag: "AF-0002", name: "HP LaserJet 5200",        category: "Printers",     serialNumber: "SN-HP52-002", location: "Finance – Floor 1", status: "AVAILABLE",          condition: "GOOD", acquisitionDate: "2022-09-01", acquisitionCost: 22000, isBookable: false },
  { id: 3,  assetTag: "AF-0003", name: "Conference Room A",       category: "Meeting Rooms", serialNumber: "ROOM-A-001",  location: "HQ – Floor 3",      status: "RESERVED",           condition: "NEW",  acquisitionDate: "2021-06-10", acquisitionCost: 0,     isBookable: true  },
  { id: 4,  assetTag: "AF-0004", name: "Epson Projector Pro",     category: "Projectors",   serialNumber: "SN-EP-004",   location: "Training Room",     status: "UNDER_MAINTENANCE",  condition: "FAIR", acquisitionDate: "2020-11-20", acquisitionCost: 35000, isBookable: true  },
  { id: 5,  assetTag: "AF-0005", name: "MacBook Pro M2",          category: "Laptops",      serialNumber: "SN-MBP-005",  location: "Design Team",       status: "AVAILABLE",          condition: "NEW",  acquisitionDate: "2024-02-01", acquisitionCost: 145000, isBookable: false },
  { id: 6,  assetTag: "AF-0006", name: "Logitech MX Keys Board",  category: "Keyboards",    serialNumber: "SN-LMX-006",  location: "IT Store",          status: "AVAILABLE",          condition: "GOOD", acquisitionDate: "2023-05-10", acquisitionCost: 8500,  isBookable: false },
  { id: 7,  assetTag: "AF-0007", name: "Toyota Innova (MH12AB1234)", category: "Vehicles",  serialNumber: "VIN-TOY-007", location: "Basement Parking",  status: "ALLOCATED",          condition: "GOOD", acquisitionDate: "2022-04-15", acquisitionCost: 1800000, isBookable: true },
  { id: 8,  assetTag: "AF-0008", name: "LG 27\" 4K Monitor",      category: "Monitors",     serialNumber: "SN-LG4K-008", location: "Dev Team – Floor 2",status: "ALLOCATED",          condition: "NEW",  acquisitionDate: "2024-01-20", acquisitionCost: 28000, isBookable: false },
  { id: 9,  assetTag: "AF-0009", name: "Canon EOS R5 Camera",     category: "Electronics",  serialNumber: "SN-CR5-009",  location: "Media Cupboard",    status: "AVAILABLE",          condition: "GOOD", acquisitionDate: "2023-07-01", acquisitionCost: 220000, isBookable: true },
  { id: 10, assetTag: "AF-0010", name: "Aeron Chair (Blue Tag)",   category: "Furniture",    serialNumber: "CHAIR-010",   location: "Board Room",        status: "RETIRED",            condition: "POOR", acquisitionDate: "2018-01-01", acquisitionCost: 45000, isBookable: false },
];

const CATEGORIES = ["All", "Laptops", "Printers", "Meeting Rooms", "Projectors", "Monitors", "Keyboards", "Vehicles", "Electronics", "Furniture"];
const STATUSES: ("All" | AssetStatus)[] = ["All", "AVAILABLE", "ALLOCATED", "RESERVED", "UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"];

export const Assets: React.FC = () => {
  const [search, setSearch]           = useState("");
  const [catFilter, setCatFilter]     = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | AssetStatus>("All");
  const [showRegister, setShowRegister] = useState(false);
  const [assets, setAssets]           = useState<Asset[]>(MOCK_ASSETS);

  // Register form state
  const [form, setForm] = useState({
    name: "", serialNumber: "", category: "Laptops",
    location: "", acquisitionDate: "", acquisitionCost: "",
    condition: "GOOD" as AssetCondition, isBookable: false,
  });

  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || a.category === catFilter;
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = assets.length + 1;
    const newAsset: Asset = {
      id: newId,
      assetTag: `AF-${String(newId).padStart(4, "0")}`,
      name: form.name,
      category: form.category,
      serialNumber: form.serialNumber,
      location: form.location,
      status: "AVAILABLE",
      condition: form.condition,
      acquisitionDate: form.acquisitionDate,
      acquisitionCost: Number(form.acquisitionCost),
      isBookable: form.isBookable,
    };
    setAssets([newAsset, ...assets]);
    setShowRegister(false);
    setForm({ name: "", serialNumber: "", category: "Laptops", location: "", acquisitionDate: "", acquisitionCost: "", condition: "GOOD", isBookable: false });
  };

  // Summary counts
  const available   = assets.filter((a) => a.status === "AVAILABLE").length;
  const allocated   = assets.filter((a) => a.status === "ALLOCATED").length;
  const maintenance = assets.filter((a) => a.status === "UNDER_MAINTENANCE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Assets Directory</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {assets.length} assets registered &mdash; {available} available, {allocated} allocated, {maintenance} in maintenance
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all self-start sm:self-auto border border-blue-400/20"
        >
          <Plus className="w-4 h-4" /> Register Asset
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_META) as [AssetStatus, {label:string;color:string}][]).map(([key, meta]) => {
          const count = assets.filter((a) => a.status === key).length;
          if (!count) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "All" : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${meta.color} ${statusFilter === key ? "ring-2 ring-white/20" : ""}`}
            >
              {meta.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag or serial number…"
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 pl-4 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 pl-4 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {STATUSES.map((s) => <option key={s}>{s === "All" ? "All Statuses" : STATUS_META[s].label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel border border-slate-900 rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No assets match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Asset Tag</th>
                  <th className="px-6 py-4">Name &amp; Category</th>
                  <th className="px-6 py-4">Serial #</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Acquired</th>
                  <th className="px-6 py-4">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filtered.map((asset) => {
                  const sm = STATUS_META[asset.status];
                  const cm = CONDITION_META[asset.condition];
                  return (
                    <tr key={asset.id} className="hover:bg-slate-900/30 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          {asset.assetTag}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-bold text-white">{asset.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3" />{asset.category}
                          {asset.isBookable && <span className="ml-1 text-purple-400 font-semibold">[Bookable]</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{asset.serialNumber}</td>
                      <td className="px-6 py-4 text-slate-300 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />{asset.location}
                      </td>
                      <td className={`px-6 py-4 text-xs font-bold ${cm.color}`}>{cm.label}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${sm.color}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Intl.DateTimeFormat("en-IN").format(new Date(asset.acquisitionDate))}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm font-semibold">
                        {asset.acquisitionCost > 0 ? `₹${asset.acquisitionCost.toLocaleString("en-IN")}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Asset Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Register New Asset
              </h3>
              <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 grid grid-cols-2 gap-4">
              {/* Asset Name */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Asset Name *</label>
                <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {/* Serial */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Serial Number *</label>
                <input required value={form.serialNumber} onChange={(e) => setForm({...form, serialNumber: e.target.value})}
                  placeholder="SN-XXXX-001"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  {CATEGORIES.filter(c => c !== "All").map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Location */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location *</label>
                <input required value={form.location} onChange={(e) => setForm({...form, location: e.target.value})}
                  placeholder="e.g. IT Dept – Floor 2"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Purchase Date</label>
                <input type="date" value={form.acquisitionDate} onChange={(e) => setForm({...form, acquisitionDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {/* Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Purchase Price (₹)</label>
                <input type="number" value={form.acquisitionCost} onChange={(e) => setForm({...form, acquisitionCost: e.target.value})}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Condition</label>
                <select value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value as AssetCondition})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  {(["NEW","GOOD","FAIR","POOR"] as AssetCondition[]).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Bookable */}
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" id="bookable" checked={form.isBookable} onChange={(e) => setForm({...form, isBookable: e.target.checked})}
                  className="w-4 h-4 rounded accent-blue-500" />
                <label htmlFor="bookable" className="text-sm text-slate-300 font-medium">Asset is Bookable (room/vehicle)</label>
              </div>

              <div className="col-span-2 flex gap-3 justify-end pt-4 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => setShowRegister(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 transition-colors">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
