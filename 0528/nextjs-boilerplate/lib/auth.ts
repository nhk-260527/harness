// lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnLogin = nextUrl.pathname === "/login"

      if (isOnDashboard) {
        return isLoggedIn
      }
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
})
