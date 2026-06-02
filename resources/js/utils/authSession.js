export const AUTH_TOKEN_MARKER = "cookie-session";

const ROLE_KEYS = ["admin", "coordinator", "student"];
const SESSION_KEYS = ["token", "user", "role", ...ROLE_KEYS];

const roleMarker = (role) => JSON.stringify({ authenticated: true, role });

export const startAuthSession = (role) => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem("token", AUTH_TOKEN_MARKER);
  localStorage.setItem("role", role);
  localStorage.setItem(role, roleMarker(role));
};

export const clearAuthSession = (extraKeys = []) => {
  [...SESSION_KEYS, ...extraKeys].forEach((key) => localStorage.removeItem(key));
};

export const getAuthToken = () => localStorage.getItem("token");

export const isAuthenticatedAs = (role) =>
  getAuthToken() === AUTH_TOKEN_MARKER && localStorage.getItem(role) !== null;

export const authHeaders = () => {
  const token = getAuthToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};
