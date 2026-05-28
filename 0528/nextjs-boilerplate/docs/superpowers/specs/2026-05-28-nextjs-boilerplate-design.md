# Next.js Boilerplate Design

**Date:** 2026-05-28  
**Stack:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui + NextAuth.js v5 + PostgreSQL + Prisma  
**Target:** Vercel

---

## Overview

A minimal Next.js boilerplate with Google OAuth authentication, a protected dashboard, and a PostgreSQL database via Prisma. Intended as a starting point for new projects — not a feature-complete app.

---

## Folder Structure

```
nextjs-boilerplate/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page with Google sign-in button
│   ├── (protected)/
│   │   └── dashboard/
│   │       └── page.tsx          # Protected dashboard (requires auth)
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts      # NextAuth handler
│   ├── layout.tsx                # Root layout (SessionProvider)
│   └── page.tsx                  # Root → redirect to /dashboard
├── components/
│   └── ui/                       # shadcn components (auto-generated)
├── lib/
│   ├── auth.ts                   # NextAuth config (Google provider + Prisma adapter)
│   └── db.ts                     # Prisma client singleton
├── prisma/
│   └── schema.prisma             # User, Account, Session models
├── middleware.ts                 # Route protection via auth() wrapper
├── .env.local.example            # Environment variable template
├── docker-compose.yml            # Local PostgreSQL
└── ...config files (next.config, tailwind.config, etc.)
```

---

## Architecture

### Authentication Flow

1. Unauthenticated user visits `/dashboard`
2. `middleware.ts` intercepts and redirects to `/login`
3. User clicks "Sign in with Google"
4. NextAuth handles OAuth callback at `/api/auth/[...nextauth]`
5. Prisma adapter saves/updates User + Account in DB
6. Session created, user redirected to `/dashboard`

### Route Protection

`middleware.ts` uses the `auth()` wrapper from NextAuth v5. Protected prefix: `/dashboard` (and any future protected routes). Public routes: `/login`, `/api/auth/*`.

### Database Access

`lib/db.ts` exports a single Prisma Client instance (singleton pattern to avoid connection exhaustion in dev with hot reload).

---

## Components

**shadcn components installed at init:**
- `Button` — login page CTA, general use
- `Card` — dashboard layout
- `Avatar` — user avatar in header
- `DropdownMenu` — user menu with sign-out option

**Pages:**
- `/login` — centered card with "Sign in with Google" button, displays error message if `?error=` query param present
- `/dashboard` — simple protected page showing user name/email/avatar, sign-out dropdown

---

## Data Model

NextAuth standard adapter schema:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Environment Variables

```bash
# .env.local
AUTH_SECRET=          # generate with: npx auth secret
AUTH_GOOGLE_ID=       # Google Cloud Console OAuth client ID
AUTH_GOOGLE_SECRET=   # Google Cloud Console OAuth client secret
DATABASE_URL=         # PostgreSQL connection string
```

---

## Error Handling

- **Login failure:** NextAuth redirects to `/login?error=<code>`, login page reads query param and shows error message
- **DB connection failure:** Prisma throws, error surfaces to `error.tsx`, logged server-side
- **Unauthenticated access:** Middleware redirects to `/login` immediately — no flash

---

## Local Development

- PostgreSQL via `docker-compose.yml` — `docker compose up -d` to start
- Copy `.env.local.example` to `.env.local` and fill in values
- `npx prisma migrate dev` to apply schema
- `npm run dev` to start Next.js

---

## Vercel Deployment Checklist

1. Create Vercel Postgres database → copy `DATABASE_URL` to environment variables
2. Create Google OAuth app in Google Cloud Console → copy Client ID and Secret
3. Generate `AUTH_SECRET` with `npx auth secret` → add to Vercel env vars
4. Run `npx prisma migrate deploy` (via Vercel build command or manually)
5. Set `AUTH_URL` to production URL (required by NextAuth v5 in some environments)

---

## Out of Scope

- User profile/settings pages
- Dark mode toggle
- Landing/marketing page
- Email/password auth
- Role-based access control
- Seed data
