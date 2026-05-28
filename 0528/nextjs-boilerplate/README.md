# Next.js Boilerplate

Next.js 16 + Tailwind CSS + shadcn/ui + NextAuth.js v5 + PostgreSQL + Prisma

## Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** NextAuth.js v5 with Google OAuth
- **Database:** PostgreSQL + Prisma ORM v7
- **Deployment:** Vercel

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in values:
   ```bash
   cp .env.local.example .env.local
   ```

3. Generate `AUTH_SECRET`:
   ```bash
   npx auth secret
   ```
   Paste the output into `AUTH_SECRET` in `.env.local`.

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID → `AUTH_GOOGLE_ID`
   - Copy Client Secret → `AUTH_GOOGLE_SECRET`

5. Start the local database:
   ```bash
   docker compose up -d
   ```

6. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

7. Start the dev server:
   ```bash
   npm run dev
   ```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## Vercel Deployment

1. Create a Vercel Postgres database in your Vercel project → copy `DATABASE_URL` to environment variables.
2. Add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` to Vercel environment variables.
3. Add `AUTH_URL=https://your-app.vercel.app` to Vercel environment variables.
4. Add this to your Vercel build command (or run manually after deploy):
   ```bash
   npx prisma migrate deploy
   ```
5. Update Google OAuth authorized redirect URIs to include:
   `https://your-app.vercel.app/api/auth/callback/google`

## Project Structure

```
app/
├── (auth)/login/          # Login page
├── (protected)/dashboard/ # Protected dashboard
├── api/auth/[...nextauth] # NextAuth handler
├── layout.tsx
├── page.tsx               # Redirects to /dashboard
└── error.tsx
lib/
├── auth.ts                # NextAuth config
└── db.ts                  # Prisma singleton
prisma/
└── schema.prisma
middleware.ts              # Route protection
```
