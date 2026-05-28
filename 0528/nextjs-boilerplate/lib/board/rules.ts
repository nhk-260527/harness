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
