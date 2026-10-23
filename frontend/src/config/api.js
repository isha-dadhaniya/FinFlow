// Central API URL configuration for FINFLOW
// Reads VITE_API_URL in production (e.g., on Vercel), falls back to local server in development
export const API_BASE_URL = import.meta.env.VITE_API_URL|| "https://finflow-backend-qccd.onrender.com";
export const API = API_BASE_URL;
export default API_BASE_URL;
