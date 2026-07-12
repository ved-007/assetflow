import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

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

  // Restore session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data?.ok) {
          setUser(response.data.data);
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
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.ok) {
        setUser(response.data.data);
        localStorage.setItem("assetflow_mock_user", JSON.stringify(response.data.data));
      }
    } catch (err: any) {
      // Mock login for offline testing if API is unavailable during hackathon
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
      throw new Error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/signup", { name, email, password });
      if (response.data?.ok) {
        setUser(response.data.data);
        localStorage.setItem("assetflow_mock_user", JSON.stringify(response.data.data));
      }
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
      throw new Error(err.response?.data?.error || "Signup failed");
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
