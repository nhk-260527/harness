import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CommentForm } from "@/components/board/comment-form"
import { auth } from "@/lib/auth"
import { updateCommentAction } from "@/lib/board/actions"
import { getCommentForEdit } from "@/lib/board/queries"

export default async function EditBoardCommentPage({
  params,
  searchParams,
}: {
  params: Promise<{ commentId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ commentId }, { error }] = await Promise.all([params, searchParams])
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const comment = await getCommentForEdit(commentId, session.user.id)

  if (!comment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(245,240,230,1)_50%,_rgba(235,227,213,1)_100%)]">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Edit comment
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Update your comment
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              On post:{" "}
              <span className="font-medium text-foreground">{comment.post.title}</span>
            </p>
          </div>
          <Link
            href={`/board/${comment.post.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
          >
            Back
          </Link>
        </div>

        <div className="rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_20px_80px_rgba(100,85,60,0.08)]">
          <CommentForm
            action={updateCommentAction}
            postId={comment.post.id}
            commentId={comment.id}
            submitLabel="Save changes"
            cancelHref={`/board/${comment.post.id}`}
            error={error}
            defaultValue={comment.body}
          />
        </div>
      </main>
    </div>
  )
}
