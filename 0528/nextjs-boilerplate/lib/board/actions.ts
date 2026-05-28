"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { canEditRecord, normalizeTags } from "./rules"

function readTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === "string" ? value.trim() : ""
}

function failRedirect(target: string, message: string): never {
  redirect(`${target}?error=${encodeURIComponent(message)}`)
}

async function requireUserId() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return session.user.id
}

export async function createPostAction(formData: FormData) {
  const userId = await requireUserId()
  const title = readTextField(formData, "title")
  const body = readTextField(formData, "body")
  const tags = normalizeTags(readTextField(formData, "tags"))

  if (!title) {
    failRedirect("/board/new", "Title is required.")
  }

  if (!body) {
    failRedirect("/board/new", "Body is required.")
  }

  const post = await db.post.create({
    data: {
      authorId: userId,
      title,
      body,
      tags,
    },
  })

  revalidatePath("/board")
  redirect(`/board/${post.id}`)
}

export async function updatePostAction(formData: FormData) {
  const userId = await requireUserId()
  const postId = readTextField(formData, "postId")
  const title = readTextField(formData, "title")
  const body = readTextField(formData, "body")
  const tags = normalizeTags(readTextField(formData, "tags"))

  if (!postId) {
    failRedirect("/board", "Missing post id.")
  }

  const post = await db.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.deletedAt) {
    failRedirect("/board", "Post not found.")
  }

  if (!canEditRecord(post.authorId, userId)) {
    failRedirect(`/board/${postId}`, "You can only edit your own post.")
  }

  if (!title) {
    failRedirect(`/board/${postId}/edit`, "Title is required.")
  }

  if (!body) {
    failRedirect(`/board/${postId}/edit`, "Body is required.")
  }

  await db.post.update({
    where: { id: postId },
    data: {
      title,
      body,
      tags,
    },
  })

  revalidatePath("/board")
  revalidatePath(`/board/${postId}`)
  redirect(`/board/${postId}`)
}

export async function deletePostAction(formData: FormData) {
  const userId = await requireUserId()
  const postId = readTextField(formData, "postId")

  if (!postId) {
    failRedirect("/board", "Missing post id.")
  }

  const post = await db.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.deletedAt) {
    failRedirect("/board", "Post not found.")
  }

  if (!canEditRecord(post.authorId, userId)) {
    failRedirect(`/board/${postId}`, "You can only delete your own post.")
  }

  await db.post.update({
    where: { id: postId },
    data: {
      deletedAt: new Date(),
    },
  })

  revalidatePath("/board")
  revalidatePath(`/board/${postId}`)
  redirect("/board")
}

export async function createCommentAction(formData: FormData) {
  const userId = await requireUserId()
  const postId = readTextField(formData, "postId")
  const body = readTextField(formData, "body")

  if (!postId) {
    failRedirect("/board", "Missing post id.")
  }

  if (!body) {
    failRedirect(`/board/${postId}`, "Comment text is required.")
  }

  const post = await db.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.deletedAt) {
    failRedirect("/board", "Post not found.")
  }

  await db.comment.create({
    data: {
      postId,
      authorId: userId,
      body,
    },
  })

  revalidatePath("/board")
  revalidatePath(`/board/${postId}`)
  redirect(`/board/${postId}`)
}

export async function updateCommentAction(formData: FormData) {
  const userId = await requireUserId()
  const commentId = readTextField(formData, "commentId")
  const body = readTextField(formData, "body")

  if (!commentId) {
    failRedirect("/board", "Missing comment id.")
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment || comment.deletedAt) {
    failRedirect("/board", "Comment not found.")
  }

  if (!canEditRecord(comment.authorId, userId)) {
    failRedirect(`/board/${comment.postId}`, "You can only edit your own comment.")
  }

  if (!body) {
    failRedirect(`/board/comments/${commentId}/edit`, "Comment text is required.")
  }

  await db.comment.update({
    where: { id: commentId },
    data: {
      body,
    },
  })

  revalidatePath("/board")
  revalidatePath(`/board/${comment.postId}`)
  redirect(`/board/${comment.postId}`)
}

export async function deleteCommentAction(formData: FormData) {
  const userId = await requireUserId()
  const commentId = readTextField(formData, "commentId")

  if (!commentId) {
    failRedirect("/board", "Missing comment id.")
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment || comment.deletedAt) {
    failRedirect("/board", "Comment not found.")
  }

  if (!canEditRecord(comment.authorId, userId)) {
    failRedirect(`/board/${comment.postId}`, "You can only delete your own comment.")
  }

  await db.comment.update({
    where: { id: commentId },
    data: {
      deletedAt: new Date(),
    },
  })

  revalidatePath("/board")
  revalidatePath(`/board/${comment.postId}`)
  redirect(`/board/${comment.postId}`)
}
