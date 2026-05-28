# Board + Comments Design

**Date:** 2026-05-28  
**Stack:** Next.js 16 (App Router) + Tailwind CSS + shadcn/ui + NextAuth.js v5 + PostgreSQL + Prisma  
**Target:** Vercel

---

## Overview

Add a public cafe-style board to the existing app. Everyone can read posts and comments. Only signed-in users can create, edit, or delete posts and comments. Posts and comments use soft delete, so deleted content stays in the database but is hidden or rendered as deleted in the UI.

The feature should feel simple and familiar:
- public browsing
- login required to write
- writer-only edit/delete controls
- posts with title, body, and tags
- flat comments only, no replies

---

## Scope

### In Scope

- Public post list and post detail pages
- Post creation, edit, and soft delete
- Comment creation, edit, and soft delete
- Tag-based organization for posts
- Author-only ownership checks for edit/delete actions
- Public read access for all visitors

### Out of Scope

- Nested replies
- Likes, bookmarks, or pinned posts
- Rich text editor or image uploads
- Moderation dashboard
- Categories or forum sections
- Anonymous posting

---

## Information Architecture

### Public Routes

- `/board` - post list, search, and tag filtering
- `/board/new` - new post form for signed-in users
- `/board/[id]` - post detail with comments

### Authenticated Actions

- Create post
- Edit own post
- Soft delete own post
- Create comment
- Edit own comment
- Soft delete own comment

### Navigation

- The existing root redirect can continue to point to `/dashboard` for now.
- Add a visible board entry point in the main app shell or dashboard so users can reach `/board`.
- The board should remain readable even when the visitor is not signed in.

---

## Data Model

Use the existing `User` model from NextAuth/Prisma and add board-specific tables.

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

### Notes

- `tags` start as a string array to keep the first version simple.
- `deletedAt` implements soft delete.
- Queries should exclude deleted posts/comments by default unless rendering deletion placeholders.
- Ownership checks rely on `authorId`.

---

## UI Design

### `/board`

- Shows the most recent posts first
- Includes a compact search input
- Shows tags as small pills
- Displays post title, snippet, author, and relative time
- Shows a prominent `Write post` button for signed-in users
- Shows a login prompt if the visitor is not signed in and tries to write

### `/board/new`

- Form fields:
  - title
  - body
  - tags
- Tags can be entered as a comma-separated text field in the first version
- Submit creates a post and redirects to the new post detail page

### `/board/[id]`

- Shows the full post
- Shows author, timestamp, and tags
- Shows edit/delete controls only for the post author
- Shows comment list underneath
- Comment form appears for signed-in users
- Comment edit/delete controls appear only for the comment author
- Deleted post or comment content renders as a deleted placeholder instead of disappearing entirely

---

## Permissions

### Read

- Anyone can read posts and comments

### Write

- Only authenticated users can create posts and comments

### Modify Own Content

- A post author can edit or delete their own post
- A comment author can edit or delete their own comment

### Soft Delete Behavior

- Soft deleted posts should not appear in normal post lists
- Soft deleted comments should not appear in normal comment lists
- On detail pages, deleted items can render as:
  - `This post was deleted.`
  - `This comment was deleted.`

---

## Routing and Server Flow

### Post List

1. Visitor loads `/board`
2. Server fetches latest visible posts
3. Client sees a public list, even if not logged in

### Create Post

1. Signed-in user opens `/board/new`
2. Server action validates title/body/tags
3. Post is written with `authorId` from the session
4. Redirect to `/board/[id]`

### Create Comment

1. Signed-in user submits a comment on `/board/[id]`
2. Server action validates comment body
3. Comment is written with `authorId` and `postId`
4. Detail page refreshes

### Edit/Delete Own Content

1. Server resolves the current session
2. Server verifies `authorId` matches the logged-in user
3. If the user owns the record, the update or soft delete proceeds
4. Otherwise the action returns a forbidden error

---

## Error Handling

- Unauthenticated write attempts should redirect to login or show a sign-in prompt
- Forbidden ownership attempts should return a clear `403`-style response or user-facing error
- Validation failures should be shown inline on forms
- Missing post IDs should render the existing not-found state
- Soft-deleted items should not cause the page to fail

---

## Implementation Notes

- Keep the first version simple: text-only posts, flat comments, no replies
- Reuse the existing Prisma client and auth setup
- Follow the app's current App Router and server-action patterns
- Keep route protection aligned with the current public/private split
- Avoid introducing a separate admin model unless a future requirement needs it

---

## Testing

### Minimum Verification

- Post creation succeeds for signed-in users
- Comment creation succeeds for signed-in users
- Anonymous users cannot create posts or comments
- Authors can edit/delete their own posts
- Authors can edit/delete their own comments
- Other users cannot modify someone else’s content
- Soft-deleted posts and comments are hidden from normal lists

### Suggested Test Coverage

- Server action unit tests for ownership checks
- Integration test for creating a post and comment as a signed-in user
- Regression test for unauthorized edits/deletes

---

## Deployment Considerations

- Database migrations are required for `Post` and `Comment`
- `DATABASE_URL` must already be set in Vercel
- No new OAuth scopes are needed
- Existing auth setup can continue to use Google sign-in

---

## Open Questions Resolved

- Public read access: yes
- Writing requires login: yes
- Posts include tags: yes
- Comments are flat only: yes
- Edit/delete is allowed for the author: yes
- Deletes are soft deletes: yes
