# BTM Management System — Frontend

React 18 + Vite + TypeScript frontend for the BTM management system.
Backend lives in `C:\Work\learning\btm-be` (Spring Boot, port 8080).

**Current status (step 1):** authentication — register, login, protected dashboard,
automatic token refresh, logout.

## Run

```powershell
npm install
npm run dev
```

Opens on `http://localhost:5173`. The Vite dev server proxies `/api/*` to
`http://localhost:8080`, so **start the backend first** (see btm-be README).

Production build: `npm run build` (type-checks with `tsc`, outputs to `dist/`).

## How auth works

- `src/api/client.ts` — `apiFetch` wrapper: attaches the Bearer access token, and on a
  401 performs a single-flight call to `/api/auth/refresh` (the backend's refresh tokens
  are single-use, so concurrent 401s share one refresh) and retries the request. If the
  refresh fails the session is cleared and the user lands back on `/login`.
- Tokens are stored in localStorage (`btm.accessToken` / `btm.refreshToken`).
- `src/auth/AuthContext.tsx` — holds the current user; on first load restores the session
  by calling `/api/auth/me`.
- `src/auth/ProtectedRoute.tsx` — redirects unauthenticated visitors to `/login`,
  remembering where they came from.

## Routes

| Path        | Access    | Page |
|-------------|-----------|------|
| `/login`    | public    | Sign in with **username or email** |
| `/register` | public    | Create account: first/last name, unique username, unique email (always a MEMBER; roles assigned by admins later) |
| `/`         | protected | Dashboard (Members card links through for admins; other cards are placeholders) |
| `/members`  | protected | Member directory — everyone can view; admin/president/vice president get the role dropdown and enable/disable buttons; admins also get Edit (name, username, email, optional password reset) |
| `/beneficiaries` | protected | Registry with search + status filter; committee members can add/edit/archive, admins can delete |
| `/minutes`  | protected | Meeting list with search, a date picker and status filter; committee members record and edit minutes |
| `/minutes/:id` | protected | Full minutes, plus your own private notes for that meeting |
| `/notes`    | protected | Your private notes, searchable and filterable by date |
| `/profile`  | protected | Your own details and password (reached from the user menu) |

Seeded admin for testing: `admin` (or `admin@btm.local`) / `admin123`.
