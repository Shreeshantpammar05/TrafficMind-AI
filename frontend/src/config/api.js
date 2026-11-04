// Shared API origin for all frontend HTTP and Socket.IO requests.
// Vercel can override this at build time with VITE_API_BASE_URL.
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

const defaultApiBase = import.meta.env.PROD
  ? "https://trafficmind-ai.onrender.com"
  : "http://localhost:5000";

export const API_BASE = (configuredApiBase || defaultApiBase).replace(/\/+$/, "");
