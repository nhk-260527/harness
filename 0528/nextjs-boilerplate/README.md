# Next.js Boilerplate

Next.js 16 + Tailwind CSS + shadcn/ui + NextAuth.js v5 + PostgreSQL + Prisma

## Stack

- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Auth: NextAuth.js v5 with Google OAuth
- Database: PostgreSQL + Prisma ORM v7
- Deployment: Vercel

## Local Development

### Prerequisites

- Node.js 20+
- Docker for local PostgreSQL

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

3. Generate `AUTH_SECRET`:
   ```bash
   npx auth secret
   ```

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create an OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID to `AUTH_GOOGLE_ID`
   - Copy the Client Secret to `AUTH_GOOGLE_SECRET`

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

Visit `http://localhost:3000`.

## Vercel Deployment

1. Create a Vercel Postgres or Neon database.
2. Add `DATABASE_URL` to Vercel environment variables for Prisma Client runtime.
3. Add `DIRECT_URL` to Vercel environment variables for `prisma migrate deploy`. Use the direct, non-pooler connection string.
4. Add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` to Vercel environment variables.
5. Add `AUTH_URL=https://your-app.vercel.app` to Vercel environment variables.
6. The `vercel-build` script automatically baselines an existing production database on the first deploy, then runs migrations and the Next.js build:
   ```bash
   npm run vercel-build
   ```
7. Update Google OAuth authorized redirect URIs to include:
   `https://your-app.vercel.app/api/auth/callback/google`

## Project Structure

- `app/` - App Router pages and route handlers
- `lib/` - Auth, database, and board helpers
- `prisma/` - Prisma schema and migrations
- `components/` - Shared UI components
