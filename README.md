# CampusPulse

**CampusPulse** is a production-minded campus platform for verified students, faculty, club coordinators, and administrators. It centralizes campus issue reporting, engagement, and institutional communication.

The application includes issue management, anonymous feedback, events, clubs, official announcements, notifications, map data, global search, moderation, and administrator analytics.

## Features

- React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, and Zod frontend foundation.
- Express and TypeScript API with normalized MongoDB/Mongoose models for users, issues, status history, votes, feedback, events, registrations, clubs, memberships, announcements, notifications, departments, reports, and audit logs.
- Student self-registration with configurable college-email domain enforcement.
- Password hashing with bcrypt (12 rounds); no plaintext password storage.
- Email verification and password-reset flows. Local development uses a console mail transport; production delivery is an isolated provider boundary.
- JWT access tokens plus rotating, HTTP-only refresh-token cookies. Refresh tokens are stored as hashes and invalidated at reset/logout.
- Server-enforced RBAC for `STUDENT`, `FACULTY`, `CLUB_COORDINATOR`, `ADMIN`, and `SUPER_ADMIN`.
- Security middleware: Helmet, CORS, rate limiting, MongoDB injection protection, JSON-size limits, and centralized error responses.
- Issue reporting with category, priority, location coordinates, duplicate detection, status history, department assignment, anonymous reports, voting, pagination, trending view, and map filtering.
- Anonymous feedback and authorized campus responses.
- Event creation, capacity-safe registration/cancellation, club profiles and following, and verified announcements.
- Notification inbox, global search, moderation queue, department performance, and Recharts-based administrator analytics.
- AI and cloud-storage service boundaries that are safe no-ops until a provider is configured.
- Responsive landing, account flows, protected dashboard, desktop sidebar, mobile navigation, dark mode, loading/error states, and initial unit coverage for password security and RBAC behavior.

## Architecture

```
apps/
  api/                         Express REST API
    src/
      config/                  Environment and MongoDB connection
      controllers/             Request orchestration
      middleware/              Auth, RBAC, validation, error handling
      models/                  Domain schemas and indexes
      routes/                  API route composition
      services/                Token, password, and email abstractions
      validators/              Zod request schemas
  web/                         React + Vite frontend
    src/
      api/                     Typed browser API client
      components/              Reusable accessible UI pieces
      context/                 Session state
      layouts/                 Auth and application shells
      pages/                   Landing, auth, and dashboard routes
```

## Prerequisites

- Node.js 20.11 or newer
- MongoDB (local instance or an Atlas connection string)

## Local development

1. Copy the environment template and replace the JWT values with unique secrets.

   ```powershell
   Copy-Item .env.example .env
   ```

2. Install dependencies. If your npm cache is restricted, keep it inside this project:

   ```powershell
   npm install --cache .npm-cache
   ```

3. In one terminal, start the API:

   ```powershell
   npm run dev:api
   ```

4. In a second terminal, start the frontend:

   ```powershell
   npm run dev:web
   ```

Open `http://localhost:5173`. The frontend proxies `/api` requests to `http://localhost:4000` in development.

### Create the first administrator

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`, then run the following once in a controlled environment:

```powershell
npm run seed:admin --workspace=@campuspulse/api
```

The command makes that account a verified `SUPER_ADMIN` and is idempotent.

### Local email flow

With `MAIL_MODE=console`, verification and reset URLs are written to the API terminal. In non-production mode the frontend also offers a direct verification/reset link purely for local setup. Set `MAIL_MODE=smtp` only after supplying a real email transport implementation in `apps/api/src/services/email.service.ts`.

## Environment variables

See [.env.example](.env.example). Important values:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB or Atlas connection string |
| `JWT_ACCESS_SECRET` | Access-token signing secret (32+ characters) |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret (32+ characters) |
| `CLIENT_ORIGIN` | Allowed browser origin |
| `COLLEGE_EMAIL_DOMAIN` | Optional domain restriction, e.g. `college.edu` |
| `MAIL_MODE` | `console` locally or `smtp` when a provider is configured |
| `SEED_ADMIN_EMAIL` | One-time super-admin bootstrap email |
| `SEED_ADMIN_PASSWORD` | One-time super-admin bootstrap password |
| `VITE_API_BASE_URL` | Public API URL for a hosted frontend; configured in `apps/web/.env` locally |

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a student account and send verification |
| POST | `/api/auth/verify-email` | Verify a college email token |
| POST | `/api/auth/login` | Sign in and receive access/refresh tokens |
| POST | `/api/auth/refresh` | Rotate a refresh token and issue a new access token |
| POST | `/api/auth/logout` | Revoke current refresh token |
| POST | `/api/auth/forgot-password` | Start password recovery |
| POST | `/api/auth/reset-password` | Set a new password and revoke sessions |
| GET | `/api/auth/me` | Read authenticated user |
| GET/POST | `/api/issues` | List or submit issues |
| GET/PATCH/DELETE | `/api/issues/:id` | Read, update, or remove an issue |
| POST/DELETE | `/api/issues/:id/vote` | Add or remove an upvote |
| GET | `/api/issues/map` | Retrieve map markers with filters |
| GET/POST | `/api/feedback` | View or submit feedback |
| GET/POST | `/api/events` | View or create events |
| POST/DELETE | `/api/events/:id/register` | Register or cancel event registration |
| GET/POST | `/api/clubs` | View or create clubs |
| POST/DELETE | `/api/clubs/:id/follow` | Follow or unfollow a club |
| GET/POST | `/api/announcements` | View or publish official announcements |
| GET | `/api/notifications` | Read the notification inbox |
| GET | `/api/search?q=…` | Search issues, events, clubs, and announcements |
| GET | `/api/admin/analytics` | Administrator reporting metrics |
| GET/POST | `/api/departments` | Department management |
| GET/POST/PATCH | `/api/moderation/reports` | Content reporting and review |
| GET | `/api/health` | Health check |

All API responses follow this envelope:

```json
{ "success": true, "message": "…", "data": {} }
```

Error responses use `success: false` with a consistent error code and optional validation details.

## Verification

```powershell
npm run build
npm run test
```

## Deployment

- [vercel.json](vercel.json) configures the Vite frontend build. In Vercel set `VITE_API_BASE_URL` to your deployed API URL.
- [render.yaml](render.yaml) defines the API service. Supply `MONGODB_URI`, `CLIENT_ORIGIN`, and `APP_URL` through Render; do not commit them.
- Use MongoDB Atlas in production, enable HTTPS, use unique JWT secrets, set the exact frontend `CLIENT_ORIGIN`, and replace the console email adapter with a real provider.

## Provider extensions

`apps/api/src/services/ai.service.ts` and `apps/api/src/services/storage.service.ts` are deliberate server-side interfaces. Connect an embedding/LLM provider or Cloudinary/S3 implementation there; API keys stay in deployment environment variables and never enter the frontend bundle.
