import axios from "axios";

// Standard hackathon backend URL, falls back to localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error response mapper utility
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
