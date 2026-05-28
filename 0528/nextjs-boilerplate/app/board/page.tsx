import Link from "next/link"

import { auth, signOut } from "@/lib/auth"
import { listBoardPosts } from "@/lib/board/queries"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function authorLabel(name: string | null | undefined, email: string | null | undefined) {
  return name ?? email?.split("@")[0] ?? "Anonymous"
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const [session, posts] = await Promise.all([auth(), listBoardPosts(tag)])
  const tags = Array.from(
    new Set(posts.flatMap((post: (typeof posts)[number]) => post.tags))
  ).sort() as string[]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(245,240,230,1)_40%,_rgba(235,227,213,1)_100%)] text-foreground">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Community board
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Neighborhood Cafe</h1>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <div className="hidden items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-1.5 sm:flex">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? "User"} />
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">
                      {authorLabel(session.user.name, session.user.email ?? "")}
                    </p>
                    <p className="text-xs text-muted-foreground">Writer mode</p>
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/board" })
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-black/5"
              >
                Sign in to write
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_20px_80px_rgba(100,85,60,0.08)]">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Public board
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight">
              누구나 읽고, 로그인한 사람만 글을 남길 수 있는 카페형 게시판
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              게시글과 댓글은 작성자만 수정·삭제할 수 있고, 삭제는 소프트 삭제로
              기록을 남깁니다. 태그로 글을 묶어두고, 최신 순으로 편하게 읽을 수
              있어요.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/board/new"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
              >
                Write a post
              </Link>
              {tag ? (
                <Link
                  href="/board"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
                >
                  Clear tag filter
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/8 bg-white/75 p-6 shadow-[0_20px_80px_rgba(100,85,60,0.06)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Quick notes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>• Everyone can browse the board without signing in.</li>
              <li>• Posting requires Google sign-in.</li>
              <li>• Tags are optional and comma separated.</li>
              <li>• Deleted content stays in the database for recovery history.</li>
            </ul>
          </aside>
        </section>

        {tags.length ? (
          <section className="mt-8 rounded-3xl border border-black/8 bg-white/70 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Tags
              </span>
              {tags.map((item: string) => {
                const active = item === tag
                return (
                  <Link
                    key={item}
                    href={`/board?tag=${encodeURIComponent(item)}`}
                    className={[
                      "rounded-full px-3 py-1 text-sm transition",
                      active
                        ? "bg-foreground text-background"
                        : "border border-black/10 bg-white hover:bg-black/5",
                    ].join(" ")}
                  >
                    #{item}
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight">
              {tag ? `Posts tagged #${tag}` : "Latest posts"}
            </h3>
            <p className="text-sm text-muted-foreground">{posts.length} posts</p>
          </div>

          {posts.length ? (
            <div className="grid gap-4">
              {posts.map((post: (typeof posts)[number]) => (
                <article
                  key={post.id}
                  className="rounded-[1.75rem] border border-black/8 bg-white/85 p-6 shadow-[0_10px_40px_rgba(100,85,60,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(100,85,60,0.1)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{authorLabel(post.author.name, post.author.email)}</span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span>{post._count.comments} comments</span>
                      </div>
                      <Link
                        href={`/board/${post.id}`}
                        className="block text-2xl font-semibold tracking-tight transition hover:opacity-80"
                      >
                        {post.title}
                      </Link>
                      <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {post.body.slice(0, 240)}
                        {post.body.length > 240 ? "…" : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((item: string) => (
                        <Link
                          key={item}
                          href={`/board?tag=${encodeURIComponent(item)}`}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-black/5"
                        >
                          #{item}
                        </Link>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-white/70 p-10 text-center">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to share a story, question, or café recommendation.
              </p>
              <div className="mt-6">
                <Link
                  href="/board/new"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                >
                  Write the first post
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
