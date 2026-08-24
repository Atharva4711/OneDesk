import axios from "axios";

function getCleanBackendUrl() {
  let raw = import.meta.env.VITE_BACKEND_URL || "";
  raw = String(raw).trim();
  // In local development mode, connect to local Express server on port 8002
  if (import.meta.env.DEV && !raw) return "http://localhost:8002";
  // If a custom external backend URL is explicitly configured
  if (raw && !raw.includes("onedesk-production") && !raw.includes("localhost")) {
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    return raw.replace(/\/+$/, "");
  }
  // In production on Vercel, use same-origin relative /api (0 CORS, 0 Network Error!)
  return "";
}

export const BACKEND_URL = getCleanBackendUrl();
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("aura_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function formatApiError(e) {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return e?.message || "Something went wrong";
}

export default api;
