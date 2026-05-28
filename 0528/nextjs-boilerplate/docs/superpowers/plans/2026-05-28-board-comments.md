# Board + Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public cafe-style board where anyone can read posts and comments, signed-in users can create content, and authors can edit or soft-delete their own posts and comments.

**Architecture:** Keep the feature split into three boundaries: database models and query helpers in `prisma/` and `lib/board/`, UI routes under `app/board/`, and reusable forms/components under `components/board/`. Public read access should work without auth, while write/edit/delete actions should always verify ownership on the server before mutating data. Soft delete should hide content from normal lists but keep records for history and deleted-state rendering.

**Tech Stack:** Next.js 16 App Router, React Server Components, Server Actions, NextAuth.js v5, Prisma, PostgreSQL, Tailwind CSS, shadcn/ui, TypeScript

---

## File Map

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add `Post` and `Comment` models with soft delete fields and relations |
| `lib/board/rules.ts` | Pure helpers for tag parsing, ownership checks, and deleted-state decisions |
| `lib/board/posts.ts` | Server-side post queries and mutations helpers |
| `lib/board/comments.ts` | Server-side comment queries and mutations helpers |
| `app/board/page.tsx` | Public board list page |
| `app/board/new/page.tsx` | New post page |
| `app/board/[id]/page.tsx` | Post detail page with comments |
| `app/board/actions.ts` | Server actions for create/edit/delete post/comment |
| `components/board/post-card.tsx` | Post list card UI |
| `components/board/post-form.tsx` | Shared post create/edit form UI |
| `components/board/comment-list.tsx` | Comment rendering UI |
| `components/board/comment-form.tsx` | Comment creation/edit form UI |
| `components/board/board-header.tsx` | Board page header, search, tag filter, and write CTA |
| `tests/lib/board/rules.test.ts` | Unit tests for pure board helper functions |
| `package.json` | Add test script if needed for the new unit tests |
| `app/(protected)/dashboard/page.tsx` | Add a visible entry point to the board |

---

## Task 1: Add Board Rule Helpers and a Small Test Harness

**Files:**
- Create: `lib/board/rules.ts`
- Create: `tests/lib/board/rules.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/board/rules.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import {
  canEditRecord,
  normalizeTags,
  renderDeletedLabel,
} from "../../../lib/board/rules"

describe("board rules", () => {
  it("normalizes tags from comma-separated input", () => {
    expect(normalizeTags("  nextjs,  prisma, board  ")).toEqual([
      "nextjs",
      "prisma",
      "board",
    ])
  })

  it("allows a user to edit their own record", () => {
    expect(canEditRecord("user-1", "user-1")).toBe(true)
  })

  it("blocks editing another user's record", () => {
    expect(canEditRecord("user-1", "user-2")).toBe(false)
  })

  it("renders deleted labels for soft-deleted content", () => {
    expect(renderDeletedLabel("post")).toBe("This post was deleted.")
    expect(renderDeletedLabel("comment")).toBe("This comment was deleted.")
  })
})
```

Add a test script to `package.json` if the repo does not already have one:

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/lib/board/rules.test.ts
```

Expected: fail because `@/lib/board/rules` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/board/rules.ts` with:

```ts
export function normalizeTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index)
}

export function canEditRecord(authorId: string, currentUserId: string) {
  return authorId === currentUserId
}

export function renderDeletedLabel(kind: "post" | "comment") {
  return kind === "post" ? "This post was deleted." : "This comment was deleted."
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- tests/lib/board/rules.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json lib/board/rules.ts tests/lib/board/rules.test.ts
git commit -m "test: add board rule helpers"
```

---

## Task 2: Add Prisma Models for Posts and Comments

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write the schema change**

Add these models to `prisma/schema.prisma`:

```prisma
model Post {
  id        String    @id @default(cuid())
  authorId  String
  title     String
  body      String
  tags      String[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]

  @@index([authorId])
  @@index([createdAt])
}

model Comment {
  id        String    @id @default(cuid())
  postId    String
  authorId  String
  body      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([authorId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Run Prisma validation**

Run:

```bash
npx prisma validate
```

Expected: fail before the model addition, then pass after the schema is updated.

- [ ] **Step 3: Create and apply a local migration**

Run:

```bash
npx prisma migrate dev --name board-comments
```

Expected: migration files created and the local database updated.

- [ ] **Step 4: Verify the generated client still builds**

Run:

```bash
npm run build
```

Expected: build succeeds with the new Prisma models.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add post and comment prisma models"
```

---

## Task 3: Build Public Board Pages

**Files:**
- Create: `app/board/page.tsx`
- Create: `app/board/new/page.tsx`
- Create: `app/board/[id]/page.tsx`
- Create: `components/board/post-card.tsx`
- Create: `components/board/post-form.tsx`
- Create: `components/board/comment-list.tsx`
- Create: `components/board/comment-form.tsx`
- Create: `components/board/board-header.tsx`
- Modify: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Write the page skeletons**

Use these route responsibilities:

```tsx
// app/board/page.tsx
// server component that lists posts, accepts searchParams for `q` and `tag`
// renders public list, write CTA, and tag pills

// app/board/new/page.tsx
// server component that checks auth() for signed-in status and renders the post form

// app/board/[id]/page.tsx
// server component that loads the post + visible comments and renders post detail, edit/delete controls, and comment form
```

Use these component responsibilities:

```tsx
// components/board/post-card.tsx
// compact card for list view with title, snippet, author, tags, and time

// components/board/post-form.tsx
// shared create/edit form with title, body, and comma-separated tags

// components/board/comment-list.tsx
// renders comments and deleted placeholders

// components/board/comment-form.tsx
// single textarea form for new comments and edit state

// components/board/board-header.tsx
// board title, search, tag chips, and write button
```

- [ ] **Step 2: Run the build to see the missing-module failures**

Run:

```bash
npm run build
```

Expected: fail until the new pages and components are wired together.

- [ ] **Step 3: Implement the pages and reusable UI**

Use the existing shadcn components already installed in the repo, and keep these rules:

- public visitors can view `/board` and `/board/[id]`
- signed-in users see the write CTA and edit/delete controls for their own content
- soft-deleted content shows the placeholder text from `renderDeletedLabel`
- `/board/new` redirects unauthenticated users to login

- [ ] **Step 4: Re-run the build**

Run:

```bash
npm run build
```

Expected: build passes for the new public board routes.

- [ ] **Step 5: Commit**

```bash
git add app/board components/board app/(protected)/dashboard/page.tsx
git commit -m "feat: add public board pages"
```

---

## Task 4: Add Server Actions for Posts and Comments

**Files:**
- Create: `app/board/actions.ts`
- Create: `lib/board/posts.ts`
- Create: `lib/board/comments.ts`
- Modify: `lib/auth.ts` if any server helper needs to be exported for auth lookups

- [ ] **Step 1: Write the server action contracts**

Implement these actions in `app/board/actions.ts`:

```ts
// createPost(formData)
// updatePost(postId, formData)
// deletePost(postId)
// createComment(postId, formData)
// updateComment(commentId, formData)
// deleteComment(commentId)
```

Each action should:
- call `auth()` to get the current session
- reject unauthenticated writes
- verify ownership before edit/delete
- use `deletedAt` for soft delete
- redirect back to the relevant board page after success

- [ ] **Step 2: Run the build to confirm the actions are not yet wired**

Run:

```bash
npm run build
```

Expected: fail until the action handlers and page imports are connected.

- [ ] **Step 3: Implement the query helpers**

In `lib/board/posts.ts`, add helpers for:

```ts
// listVisiblePosts({ q, tag })
// getPostById(id)
// createPost(...)
// updatePost(...)
// softDeletePost(...)
```

In `lib/board/comments.ts`, add helpers for:

```ts
// listVisibleComments(postId)
// createComment(...)
// updateComment(...)
// softDeleteComment(...)
```

Use `deletedAt: null` filters by default when loading list pages.

- [ ] **Step 4: Re-run the build and test**

Run:

```bash
npm test -- tests/lib/board/rules.test.ts
npm run build
```

Expected: helper tests still pass and the app builds successfully.

- [ ] **Step 5: Commit**

```bash
git add app/board/actions.ts lib/board/posts.ts lib/board/comments.ts
git commit -m "feat: add board post and comment actions"
```

---

## Task 5: Add Navigation Entry Points and Final Verification

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`
- Optionally modify: `app/layout.tsx` if a global board link is needed
- Modify: `README.md` if the new feature needs user-facing setup notes

- [ ] **Step 1: Add a visible board entry point**

Add a `Board` link or button to the dashboard header so users can navigate to `/board` without typing the URL manually.

```tsx
// Example placement: next to the account dropdown in app/(protected)/dashboard/page.tsx
// <Link href="/board">Board</Link>
```

- [ ] **Step 2: Run the full verification commands**

Run:

```bash
npm test -- tests/lib/board/rules.test.ts
npx prisma validate
npm run build
```

Expected: all checks pass.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: no lint errors.

- [ ] **Step 4: Commit**

```bash
git add app/(protected)/dashboard/page.tsx README.md
git commit -m "feat: add board navigation and final polish"
```

---

## Coverage Check

- Public read access: covered by `app/board/page.tsx` and `app/board/[id]/page.tsx`
- Login required to write: covered by `app/board/new/page.tsx` and server actions
- Author-only edit/delete: covered by `lib/board/rules.ts` and server action ownership checks
- Soft delete: covered by `deletedAt` fields in Prisma and deleted placeholders in UI
- Tags only, no categories: covered by `Post.tags: String[]`
- Flat comments only: covered by `Comment` without reply relations

---

## Execution Notes

- Keep the feature incremental and commit after each task.
- Prefer server components for read-only pages and server actions for mutations.
- Do not introduce reply threading, roles, or moderation in this pass.
