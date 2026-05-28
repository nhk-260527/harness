import Link from "next/link"
import { notFound } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CommentForm } from "@/components/board/comment-form"
import {
  createCommentAction,
  deleteCommentAction,
  deletePostAction,
} from "@/lib/board/actions"
import { auth } from "@/lib/auth"
import { getBoardPost } from "@/lib/board/queries"
import { renderDeletedLabel } from "@/lib/board/rules"

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function authorLabel(name: string | null | undefined, email: string | null | undefined) {
  return name ?? email?.split("@")[0] ?? "Anonymous"
}

export default async function BoardPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ postId }, { error }] = await Promise.all([params, searchParams])
  const [session, post] = await Promise.all([auth(), getBoardPost(postId)])

  if (!post) {
    notFound()
  }

  const isOwner = session?.user?.id === post.authorId

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(245,240,230,1)_50%,_rgba(235,227,213,1)_100%)]">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/board"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
          >
            Back to board
          </Link>
          <div className="flex flex-wrap gap-2">
            {isOwner && !post.deletedAt ? (
              <>
                <Link
                  href={`/board/${post.id}/edit`}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
                >
                  Edit post
                </Link>
                <form action={deletePostAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete post
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>

        <article className="rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_20px_80px_rgba(100,85,60,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.author.image ?? ""} alt={post.author.name ?? "User"} />
                  <AvatarFallback>
                    {post.author.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {authorLabel(post.author.name, post.author.email)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
              {post.deletedAt ? (
                <p className="rounded-2xl border border-dashed border-black/10 bg-black/5 px-4 py-3 text-sm text-muted-foreground">
                  {renderDeletedLabel("post")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/board?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-black/5"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-black/8 pt-8">
            <p className="whitespace-pre-wrap text-[1.02rem] leading-8 text-foreground">
              {post.deletedAt
                ? "The original content is hidden because this post was deleted."
                : post.body}
            </p>
          </div>
        </article>

        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_18px_60px_rgba(100,85,60,0.06)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Comments</h2>
              <p className="text-sm text-muted-foreground">
                {post.comments.length} active comments
              </p>
            </div>
          </div>

          {session?.user && !post.deletedAt ? (
            <div className="mb-8 rounded-2xl border border-black/8 bg-muted/30 p-5">
              <CommentForm
                action={createCommentAction}
                postId={post.id}
                submitLabel="Post comment"
                error={error}
              />
            </div>
          ) : session?.user ? (
            <p className="mb-8 rounded-2xl border border-dashed border-black/10 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Comments are disabled because this post has been deleted.
            </p>
          ) : (
            <div className="mb-8 rounded-2xl border border-dashed border-black/10 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Link href="/login" className="font-medium underline underline-offset-4">
                Sign in
              </Link>{" "}
              to leave a comment.
            </div>
          )}

          <div className="space-y-4">
            {post.comments.length ? (
              post.comments.map((comment: (typeof post.comments)[number]) => {
                const commentOwner = session?.user?.id === comment.authorId
                return (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-black/8 bg-background/80 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.author.image ?? ""}
                            alt={comment.author.name ?? "User"}
                          />
                          <AvatarFallback>
                            {comment.author.name?.[0]?.toUpperCase() ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {authorLabel(comment.author.name, comment.author.email)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                      </div>

                      {commentOwner ? (
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/board/comments/${comment.id}/edit`}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
                          >
                            Edit
                          </Link>
                          <form action={deleteCommentAction}>
                            <input type="hidden" name="commentId" value={comment.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              Delete
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {comment.body}
                    </p>
                  </article>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground">
                No comments yet. Start the conversation.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
