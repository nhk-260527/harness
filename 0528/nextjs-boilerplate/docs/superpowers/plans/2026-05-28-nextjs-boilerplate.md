# Next.js Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Next.js 15 boilerplate with Tailwind, shadcn/ui, Google OAuth via NextAuth.js v5, and PostgreSQL via Prisma — deployable to Vercel.

**Architecture:** App Router with route groups `(auth)` and `(protected)` for organizing login vs. protected pages. NextAuth v5's `authorized` callback handles route protection via middleware. Prisma client is a singleton in `lib/db.ts` to avoid connection exhaustion in dev.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, NextAuth.js v5 (next-auth@beta), @auth/prisma-adapter, Prisma, PostgreSQL, Vercel

---

## File Map

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — minimal, no SessionProvider needed |
| `app/page.tsx` | Root page — immediately redirects to /dashboard |
| `app/error.tsx` | Global error boundary |
| `app/(auth)/login/page.tsx` | Login page with Google sign-in button |
| `app/(protected)/dashboard/page.tsx` | Protected dashboard — shows user info + sign-out |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `lib/auth.ts` | NextAuth config — Google provider, Prisma adapter, authorized callback |
| `lib/db.ts` | Prisma client singleton |
| `prisma/schema.prisma` | User, Account, Session, VerificationToken models |
| `middleware.ts` | Re-exports auth from lib/auth.ts |
| `next.config.ts` | Adds Google image domain to remotePatterns |
| `docker-compose.yml` | Local PostgreSQL |
| `.env.local.example` | Environment variable template |
| `README.md` | Setup and deployment instructions |

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: all base Next.js files (via create-next-app)

- [ ] **Step 1: Run create-next-app in the current directory**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js project scaffolded. You may be prompted about existing files — confirm to proceed.

- [ ] **Step 2: Verify the dev server starts**

```bash
npm run dev
```

Expected: Server starts at http://localhost:3000 with no errors. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 15 project"
```

---

## Task 2: Add Docker + Environment Files

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.local.example`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boilerplate
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Create .env.local.example**

```bash
# .env.local.example
AUTH_SECRET=                  # Run: npx auth secret
AUTH_GOOGLE_ID=               # Google Cloud Console → OAuth 2.0 Client IDs
AUTH_GOOGLE_SECRET=           # Google Cloud Console → OAuth 2.0 Client IDs
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boilerplate
```

- [ ] **Step 3: Create .env.local from the example**

```bash
cp .env.local.example .env.local
```

Fill in `AUTH_SECRET` now by running `npx auth secret` and pasting the result.
Leave `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` empty for now — they'll be added in Task 4.

- [ ] **Step 4: Add .env.local to .gitignore**

Verify `.gitignore` already contains `.env.local` (create-next-app adds this). If not, add it manually.

- [ ] **Step 5: Start the local database**

```bash
docker compose up -d
```

Expected: `postgres` container starts. Verify with `docker compose ps`.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.local.example
git commit -m "chore: add docker-compose for local postgres and env template"
```

---

## Task 3: Set Up Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`
- Create: `prisma/migrations/` (auto-generated)

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` and `.env` created. Delete the generated `.env` — we use `.env.local`.

```bash
del .env
```

- [ ] **Step 2: Write prisma/schema.prisma**

Replace the entire contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **Step 3: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration files created in `prisma/migrations/`, tables created in local DB.

- [ ] **Step 4: Create lib/db.ts**

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/ lib/db.ts
git commit -m "feat: add prisma schema and db singleton"
```

---

## Task 4: Configure NextAuth.js v5

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Install NextAuth v5 and Prisma adapter**

```bash
npm install next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 2: Create lib/auth.ts**

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnLogin = nextUrl.pathname === "/login"

      if (isOnDashboard) {
        return isLoggedIn
      }
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
})
```

- [ ] **Step 3: Create app/api/auth/[...nextauth]/route.ts**

First create the directory (quote the path — shells treat `[...]` as a wildcard):
```bash
mkdir -p "app/api/auth/[...nextauth]"
```

Then create the file:
```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 4: Create middleware.ts**

```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET don't need real values for compilation.)

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/ middleware.ts package.json package-lock.json
git commit -m "feat: configure NextAuth v5 with Google provider and Prisma adapter"
```

---

## Task 5: Install shadcn/ui Components

**Files:**
- Modify: `components/ui/` (auto-generated by shadcn)
- Modify: `app/globals.css` (shadcn adds CSS variables)
- Modify: `tailwind.config.ts` (shadcn extends config)
- Create: `components.json` (shadcn config)

- [ ] **Step 1: Initialize shadcn**

```bash
npx shadcn@latest init --defaults
```

Expected: `components.json` created, `globals.css` updated with CSS variables, `tailwind.config.ts` updated.

- [ ] **Step 2: Install required components**

```bash
npx shadcn@latest add button card avatar dropdown-menu
```

Expected: Component files created in `components/ui/`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/ components.json app/globals.css tailwind.config.ts package.json package-lock.json
git commit -m "feat: install shadcn/ui with button, card, avatar, dropdown-menu"
```

---

## Task 6: Build Login Page

**Files:**
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p "app/(auth)/login"
```

- [ ] **Step 2: Create app/(auth)/login/page.tsx**

```typescript
// app/(auth)/login/page.tsx
import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">
              Authentication failed. Please try again.
            </p>
          )}
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/"
git commit -m "feat: add login page with Google sign-in"
```

---

## Task 7: Build Dashboard Page

**Files:**
- Create: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p "app/(protected)/dashboard"
```

- [ ] **Step 2: Create app/(protected)/dashboard/page.tsx**

```typescript
// app/(protected)/dashboard/page.tsx
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { name, email, image } = session.user

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b px-6 py-3 flex justify-between items-center">
        <span className="font-semibold">My App</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer h-8 w-8">
              <AvatarImage src={image ?? ""} alt={name ?? "User"} />
              <AvatarFallback>{name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <button type="submit" className="w-full text-left cursor-pointer">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{email}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(protected)/"
git commit -m "feat: add protected dashboard with user info and sign-out"
```

---

## Task 8: Root Redirect, Error Page, and Image Config

**Files:**
- Modify: `app/page.tsx`
- Create: `app/error.tsx`
- Modify: `next.config.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update app/page.tsx to redirect to /dashboard**

Replace the entire contents of `app/page.tsx`:

```typescript
// app/page.tsx
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/dashboard")
}
```

- [ ] **Step 2: Create app/error.tsx**

```typescript
// app/error.tsx
"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <button
          onClick={reset}
          className="text-sm underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update next.config.ts to allow Google profile images**

Replace the entire contents of `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Clean up app/layout.tsx**

Replace the entire contents of `app/layout.tsx` (use `Inter` from Google Fonts — create-next-app's default Geist setup uses local `.woff` files that we don't want to carry forward):

```typescript
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "App",
  description: "Next.js boilerplate",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/error.tsx app/layout.tsx next.config.ts
git commit -m "feat: add root redirect, error boundary, and google image config"
```

---

## Task 9: Write README + Final Build Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Next.js Boilerplate

Next.js 15 + Tailwind CSS + shadcn/ui + NextAuth.js v5 + PostgreSQL + Prisma

## Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** NextAuth.js v5 with Google OAuth
- **Database:** PostgreSQL + Prisma ORM
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
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Build completes successfully. No TypeScript errors, no missing module errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deployment instructions"
```

---

## Done

The boilerplate is complete. To use it as a template for a new project:

1. Clone/fork the repo
2. Follow the README local development steps
3. Add Google OAuth credentials
4. Start building on top of the protected `/dashboard` route
