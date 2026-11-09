// Shared API origin for HTTP and Socket.IO requests.
// Can be overridden using VITE_API_BASE_URL.

const configuredApiBase =
  import.meta.env.VITE_API_BASE_URL?.trim();

const defaultApiBase =
  "https://trafficmind-ai-api-migration.onrender.com";

export const API_BASE = (
  configuredApiBase || defaultApiBase
).replace(/\/+$/, "");