import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PostForm } from "@/components/board/post-form"
import { auth } from "@/lib/auth"
import { updatePostAction } from "@/lib/board/actions"
import { getEditablePost } from "@/lib/board/queries"

export default async function EditBoardPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ postId }, { error }] = await Promise.all([params, searchParams])
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const post = await getEditablePost(postId, session.user.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(245,240,230,1)_50%,_rgba(235,227,213,1)_100%)]">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Edit post
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Update your post
            </h1>
          </div>
          <Link
            href={`/board/${post.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
          >
            Back
          </Link>
        </div>

        <div className="rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_20px_80px_rgba(100,85,60,0.08)]">
          <PostForm
            action={updatePostAction}
            submitLabel="Save changes"
            cancelHref={`/board/${post.id}`}
            error={error}
            defaultValues={{
              title: post.title,
              body: post.body,
              tags: post.tags,
            }}
          />
        </div>
      </main>
    </div>
  )
}
