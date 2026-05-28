import Link from "next/link"

import { Button } from "@/components/ui/button"

type CommentFormProps = {
  action: (formData: FormData) => Promise<void>
  postId: string
  submitLabel: string
  error?: string
  defaultValue?: string
  cancelHref?: string
  commentId?: string
}

export function CommentForm({
  action,
  postId,
  submitLabel,
  error,
  defaultValue,
  cancelHref,
  commentId,
}: CommentFormProps) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      {commentId ? <input type="hidden" name="commentId" value={commentId} /> : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Comment</span>
        <textarea
          name="body"
          defaultValue={defaultValue}
          required
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Share a quick thought..."
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  )
}
