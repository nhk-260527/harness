import "server-only"

import { db } from "@/lib/db"

const authorSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

export async function listBoardPosts(tag?: string) {
  return db.post.findMany({
    where: {
      deletedAt: null,
      ...(tag ? { tags: { has: tag } } : {}),
    },
    include: {
      author: {
        select: authorSelect,
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getBoardPost(postId: string) {
  return db.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: authorSelect,
      },
      comments: {
        where: {
          deletedAt: null,
        },
        include: {
          author: {
            select: authorSelect,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })
}

export async function getEditablePost(postId: string, userId: string) {
  return db.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
      deletedAt: null,
    },
    include: {
      author: {
        select: authorSelect,
      },
    },
  })
}

export async function getCommentForEdit(commentId: string, userId: string) {
  return db.comment.findFirst({
    where: {
      id: commentId,
      authorId: userId,
      deletedAt: null,
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
        },
      },
      author: {
        select: authorSelect,
      },
    },
  })
}

