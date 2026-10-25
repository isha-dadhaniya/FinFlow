// Central API URL configuration for FINFLOW
// Reads VITE_API_URL in production (e.g., on Vercel), falls back to live Render backend
const rawUrl = import.meta.env.VITE_API_URL || "https://finflow-backend-qccd.onrender.com/api";
const cleanUrl = rawUrl.replace(/\/+$/, "");

// Ensure the base URL always includes the /api prefix
export const API_BASE_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
export const API = API_BASE_URL;
export default API_BASE_URL;
