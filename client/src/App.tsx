import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, RequireAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SocketProvider } from "./components/SocketProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { queryClient } from "./lib/queryClient";

import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { OrgSetup } from "./pages/OrgSetup";
import { Assets } from "./pages/Assets";
import { Maintenance } from "./pages/Maintenance";
import { Reports } from "./pages/Reports";
import { Notifications } from "./pages/Notifications";
import { ActivityLogs } from "./pages/ActivityLogs";
import { Allocations } from "./pages/Allocations";
import { Bookings } from "./pages/Bookings";
import { Audits } from "./pages/Audits";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <SocketProvider>
      <AppLayout>{children}</AppLayout>
    </SocketProvider>
  </RequireAuth>
);

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/org-setup"
                element={
                  <ProtectedLayout>
                    <OrgSetup />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedLayout>
                    <Assets />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedLayout>
                    <Maintenance />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedLayout>
                    <Reports />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedLayout>
                    <Notifications />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/activity-logs"
                element={
                  <ProtectedLayout>
                    <ActivityLogs />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/allocation"
                element={
                  <ProtectedLayout>
                    <Allocations />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedLayout>
                    <Bookings />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedLayout>
                    <Audits />
                  </ProtectedLayout>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
