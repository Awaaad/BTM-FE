# btm-fe — BTM Management System frontend

React 18 + Vite 5 + TypeScript, plain CSS (no UI framework). Backend:
`C:\Work\learning\btm-be` (Spring Boot, port 8080) — start it before `npm run dev`.

## Design rules

- **Mobile-first**: base CSS targets phones; `@media (min-width: 700px)` adds two-column
  forms, `@media (min-width: 1024px)` swaps the drawer for a permanent sidebar and turns
  the stacked cards back into real tables.
- **Dark green** palette via custom properties in `index.css` (`--primary` and friends).
  Never hard-code a colour; add a token.
- **Typography**: one family, exactly two weights — 400 and `var(--fw-bold)` (600).
  Don't introduce 500/700/800.
- **Tables** are written once as `<table>`; below 1024px CSS restacks each row into a card
  using `td[data-label]` for the labels. Give every `td` a `data-label`, mark the headline
  cell `.cell-primary` and the button cell `.cell-actions`.
- Tap targets are `--tap` (44px); inputs stay at 16px font so iOS doesn't zoom on focus.
- Icons come from `components/Icon` (inline SVG, `currentColor`) — no icon package.
- Primary page action: `actions` prop on desktop, `fab` prop on mobile (see Beneficiaries).

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
- Signed-in pages wrap their content in `components/AppLayout` (sidebar/drawer nav,
  breadcrumb, user menu, title/subtitle/actions row) — don't hand-roll another topbar.
- `src/roles.ts` mirrors the backend rules: `canManageRecords` (committee → beneficiaries)
  and `canManageMembers` (leadership → roles/access). These only hide controls; the server
  enforces them.
- Mutation handlers guard re-entry with a `useRef` flag (state updates are async, so a
  fast double-click would otherwise fire two requests — this caused a real double-toggle bug).

## Conventions

- Function components + hooks only, no class components.
- Styling via `src/index.css` custom properties (`--primary` etc.); reuse `.card`,
  `.alert`, `.field-error`, `.muted`, `.role-badge` classes.
- Forms show backend field errors from `ApiRequestError.errors` under each input.
