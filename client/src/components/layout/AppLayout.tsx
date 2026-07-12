import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  LayoutDashboard,
  Settings2,
  Package,
  Shuffle,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  Activity,
  Sun,
  Moon
} from "lucide-react";

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: "Asset Allocation Confirmed", body: "Laptop AF-0114 has been assigned to Priya Shah.", type: "INFO", read: false, createdAt: "3m ago" },
    { id: 2, title: "Overdue Return Warning", body: "Asset AF-0021 is past due back to the warehouse.", type: "ALERT", read: false, createdAt: "2h ago" },
    { id: 3, title: "Maintenance Approved", body: "Request for Projector AF-0062 was approved.", type: "APPROVAL", read: true, createdAt: "1d ago" },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const deleteNotif = (id: number) => setNotifications(notifications.filter((n) => n.id !== id));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: "Dashboard",           path: "/",              icon: LayoutDashboard, roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD", "EMPLOYEE"] },
    { name: "Organization Setup",  path: "/org-setup",     icon: Settings2,       roles: ["ADMIN"] },
    { name: "Assets Directory",    path: "/assets",        icon: Package,         roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD", "EMPLOYEE"] },
    { name: "Allocation & Transfer",path: "/allocation",   icon: Shuffle,         roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD"] },
    { name: "Resource Booking",    path: "/booking",       icon: CalendarDays,    roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD", "EMPLOYEE"] },
    { name: "Maintenance",         path: "/maintenance",   icon: Wrench,          roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD", "EMPLOYEE"] },
    { name: "Asset Audit",         path: "/audit",         icon: ClipboardCheck,  roles: ["ADMIN", "ASSET_MANAGER"] },
    { name: "Reports & Analytics", path: "/reports",       icon: BarChart3,       roles: ["ADMIN", "ASSET_MANAGER"] },
    { name: "Notifications",       path: "/notifications", icon: Bell,            roles: ["ADMIN", "ASSET_MANAGER", "DEPT_HEAD", "EMPLOYEE"] },
    { name: "Activity Logs",       path: "/activity-logs", icon: Activity,        roles: ["ADMIN", "ASSET_MANAGER"] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const getPageTitle = () => {
    const matched = navItems.find((item) => item.path === location.pathname);
    return matched ? matched.name : "AssetFlow";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-xl shrink-0 z-20">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
              <span className="text-sm font-black text-white">AF</span>
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight group-hover:text-teal-500 transition-colors">
              AssetFlow
            </span>
          </Link>
        </div>

        {/* User Brief */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-muted border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-500 font-bold uppercase">
            {user?.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground truncate">{user?.name}</h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-0.5 rounded bg-teal-500/10 text-teal-500 uppercase tracking-wide">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-teal-500/15 text-teal-500 border border-teal-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="fixed top-0 bottom-0 left-0 w-64 bg-background border-r border-border flex flex-col p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-foreground text-lg">AssetFlow</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-teal-500/15 text-teal-500 border border-teal-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setNotifDropdownOpen(false)} />
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 z-30 flex flex-col max-h-[420px]">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
                    <span className="text-sm font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-teal-500 hover:text-teal-400 font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">No notifications yet.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border text-xs relative transition-all ${
                            notif.read
                              ? "bg-muted/40 border-border text-muted-foreground"
                              : "bg-card border-teal-500/15 text-foreground"
                          }`}
                        >
                          <button
                            onClick={() => deleteNotif(notif.id)}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-start gap-2 pr-4">
                            {notif.type === "ALERT" && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                            {notif.type === "APPROVAL" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            {notif.type === "INFO" && <UserIcon className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
                            <div className="flex-1">
                              <h5 className="font-bold text-foreground">{notif.title}</h5>
                              <p className="mt-0.5 text-muted-foreground">{notif.body}</p>
                              <span className="inline-block mt-1 text-[10px] text-muted-foreground">{notif.createdAt}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Profile */}
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-xs font-bold text-teal-500 uppercase">
                {user?.name ? user.name.substring(0, 2) : "US"}
              </div>
              <span className="hidden md:inline-block text-sm font-semibold text-foreground">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
