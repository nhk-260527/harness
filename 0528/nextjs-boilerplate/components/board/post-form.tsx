import Link from "next/link"

import { Button } from "@/components/ui/button"

type PostFormProps = {
  action: (formData: FormData) => Promise<void>
  submitLabel: string
  cancelHref?: string
  error?: string
  defaultValues?: {
    title?: string
    body?: string
    tags?: string[]
  }
}

export function PostForm({
  action,
  submitLabel,
  cancelHref,
  error,
  defaultValues,
}: PostFormProps) {
  const tagsValue = defaultValues?.tags?.join(", ") ?? ""

  return (
    <form action={action} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          defaultValue={defaultValues?.title}
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="A short, clear title"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Body</span>
        <textarea
          name="body"
          defaultValue={defaultValues?.body}
          required
          rows={11}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Write the full post here..."
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Tags</span>
        <input
          name="tags"
          defaultValue={tagsValue}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="cafe, life, question"
        />
        <span className="text-xs text-muted-foreground">
          Separate tags with commas. Duplicate or empty tags will be removed.
        </span>
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
