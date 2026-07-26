# btm-fe — BTM Management System frontend

React 18 + Vite 5 + TypeScript, plain CSS (no UI framework). Backend:
`C:\Work\learning\btm-be` (Spring Boot, port 8080) — start it before `npm run dev`.

## Commands

- `npm run dev` — dev server on 5173, proxies `/api` → localhost:8080 (no CORS in dev).
- `npm run build` — `tsc -b` type-check + vite build.

## Architecture

- `src/api/client.ts`: `apiFetch<T>()` is THE way to call the backend — handles JSON,
  Bearer header, 401 → single-flight refresh → retry, and throws `ApiRequestError`
  (`status`, `message`, `errors` field-map from backend validation).
- `src/auth/AuthContext.tsx`: `useAuth()` → `{ user, initializing, login, register, logout }`.
  Session restore on mount via `/api/auth/me`; tokens in localStorage (`btm.*` keys).
- Routing in `src/App.tsx`; protected pages nest under `<ProtectedRoute />` (react-router v6).
- Pages in `src/pages/`, shared types in `src/types.ts` (Role union must stay in sync
  with the backend Role enum). User = firstName/lastName/username/email/role; login
  sends `{identifier, password}` where identifier is username or email.
- Role labels/order live in `src/roles.ts` (`ROLE_LABELS`, `ALL_ROLES`) — import them
  rather than re-declaring label maps per page.
- Admin-only pages gate on `user.role === 'ADMIN'` and `<Navigate to="/" replace />`
  otherwise; the backend enforces it independently with 403.

## Conventions

- Function components + hooks only, no class components.
- Styling via `src/index.css` custom properties (`--primary` etc.); reuse `.card`,
  `.alert`, `.field-error`, `.muted`, `.role-badge` classes.
- Forms show backend field errors from `ApiRequestError.errors` under each input.
