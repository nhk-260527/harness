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
