import React, { useState } from "react";
import {
  Bell, CheckCheck, Check, X,
  AlertTriangle, CheckCircle, Info, Wrench
} from "lucide-react";

type NotifType = "INFO" | "ALERT" | "APPROVAL" | "MAINTENANCE" | "SYSTEM";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const TYPE_META: Record<NotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  INFO:        { icon: <Info className="w-4 h-4" />,          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  ALERT:       { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  APPROVAL:    { icon: <CheckCircle className="w-4 h-4" />,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  MAINTENANCE: { icon: <Wrench className="w-4 h-4" />,        color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  SYSTEM:      { icon: <Bell className="w-4 h-4" />,          color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/20" },
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1,  type: "ALERT",       title: "Overdue Return Warning",            message: "Asset AF-0001 (Dell XPS 15) allocation by Priya Shah is 3 days overdue.",              isRead: false, createdAt: "2026-07-12T08:20:00" },
  { id: 2,  type: "APPROVAL",    title: "Maintenance Request Approved",       message: "Your maintenance request for AF-0006 (Logitech MX Keys) was approved by Rohan Mehta.", isRead: false, createdAt: "2026-07-12T07:45:00" },
  { id: 3,  type: "INFO",        title: "Asset Allocated to You",             message: "AF-0005 (MacBook Pro M2) has been allocated to you by IT Team.",                       isRead: false, createdAt: "2026-07-12T06:10:00" },
  { id: 4,  type: "MAINTENANCE", title: "Technician Assigned",               message: "Rajesh K. has been assigned to repair AF-0004 (Epson Projector). ETA: 2 days.",        isRead: true,  createdAt: "2026-07-11T16:00:00" },
  { id: 5,  type: "APPROVAL",    title: "Transfer Request Approved",          message: "Your transfer request for AF-0008 (LG 4K Monitor) to Arjun Dev was approved.",        isRead: true,  createdAt: "2026-07-11T12:30:00" },
  { id: 6,  type: "SYSTEM",      title: "System Maintenance Tonight",         message: "AssetFlow backend will be in maintenance mode from 11 PM - 1 AM. Save your work.",     isRead: true,  createdAt: "2026-07-10T18:00:00" },
  { id: 7,  type: "ALERT",       title: "Audit Item Flagged as Missing",      message: "Asset AF-0010 (Aeron Chair) was marked as MISSING in Audit Cycle Q2-2026.",           isRead: true,  createdAt: "2026-07-09T14:20:00" },
  { id: 8,  type: "INFO",        title: "New Booking Confirmed",              message: "Conference Room A is booked by Marketing Dept on 14 July, 2:00 PM – 4:00 PM.",        isRead: true,  createdAt: "2026-07-09T09:00:00" },
];

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60)   return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)     return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, isRead: true })));

  const markRead = (id: number) => setNotifications(notifications.map((n) => n.id === id ? { ...n, isRead: true } : n));

  const dismiss = (id: number) => setNotifications(notifications.filter((n) => n.id !== id));

  const visible = filter === "ALL" ? notifications : notifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Live system alerts, approvals, and activity updates.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 gap-1 max-w-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter === "ALL" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter === "UNREAD" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="glass-panel border border-slate-900 rounded-3xl py-20 text-center text-slate-500 text-sm">
            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-800" />
            No notifications to show.
          </div>
        ) : (
          visible.map((notif) => {
            const meta = TYPE_META[notif.type];
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  notif.isRead
                    ? "bg-slate-900/20 border-slate-900 opacity-70"
                    : "bg-slate-900/60 border-slate-800 shadow-md"
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${meta.bg} ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`text-sm font-bold ${notif.isRead ? "text-slate-300" : "text-white"}`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full align-middle" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => markRead(notif.id)}
                          title="Mark as read"
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(notif.id)}
                        title="Dismiss"
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="inline-block text-[10px] text-slate-600 font-semibold mt-2">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
