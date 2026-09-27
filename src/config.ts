/**
 * Where the API lives, relative to wherever this app is served from.
 *
 * Dev: empty, so requests go to /api/... and the Vite proxy forwards them to
 * the backend (including its context path).
 * Production: set VITE_API_BASE at build time to the backend's context path,
 * e.g. "/btm", or to a full origin if the API is on another host.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}
