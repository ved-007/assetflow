import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";

export type Role = "ADMIN" | "ASSET_MANAGER" | "DEPT_HEAD" | "EMPLOYEE";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  departmentId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = (await api.get("/auth/me")) as unknown as User;
        if (userData && userData.id) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        // Fallback for development if server is not running yet
        const localSession = localStorage.getItem("assetflow_mock_user");
        if (localSession) {
          setUser(JSON.parse(localSession));
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userData = (await api.post("/auth/login", { email, password })) as unknown as User;
      setUser(userData);
      localStorage.setItem("assetflow_mock_user", JSON.stringify(userData));
    } catch (err: any) {
      if (!err.response) {
        let mockRole: Role = "EMPLOYEE";
        if (email.includes("admin")) mockRole = "ADMIN";
        else if (email.includes("manager")) mockRole = "ASSET_MANAGER";
        else if (email.includes("head")) mockRole = "DEPT_HEAD";

        const mockUser: User = {
          id: 999,
          name: email.split("@")[0].toUpperCase().replace(".", " "),
          email,
          role: mockRole,
          departmentId: 1
        };
        setUser(mockUser);
        localStorage.setItem("assetflow_mock_user", JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userData = (await api.post("/auth/signup", { name, email, password })) as unknown as User;
      setUser(userData);
      localStorage.setItem("assetflow_mock_user", JSON.stringify(userData));
    } catch (err: any) {
      if (!err.response) {
        const mockUser: User = {
          id: Math.floor(Math.random() * 1000),
          name,
          email,
          role: "EMPLOYEE",
          departmentId: undefined
        };
        setUser(mockUser);
        localStorage.setItem("assetflow_mock_user", JSON.stringify(mockUser));
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Server logout request failed, clearing local state");
    } finally {
      setUser(null);
      localStorage.removeItem("assetflow_mock_user");
      queryClient.clear();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RequireRole = ({ roles, children }: { roles: Role[], children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
