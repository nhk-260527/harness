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
