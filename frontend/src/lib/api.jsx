import axios from "axios";

function getCleanBackendUrl() {
  let raw = import.meta.env.VITE_BACKEND_URL || "";
  raw = String(raw).trim();
  if (!raw) {
    // If in development mode and no env set, fallback to localhost:8002
    if (import.meta.env.DEV) return "http://localhost:8002";
    return "https://onedesk-production-ec3c.up.railway.app";
  }
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  return raw.replace(/\/+$/, "");
}

export const BACKEND_URL = getCleanBackendUrl();
export const API_BASE = `${BACKEND_URL}/api`;

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
