import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/core/prisma";
import { extractNimFromEmail } from "@/lib/core/nim";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user?.email) {
        return false;
      }

      const role = (user as { role?: "ADMIN" | "STUDENT" }).role ?? "STUDENT";
      if (role === "ADMIN") {
        return true;
      }

      const nim = extractNimFromEmail(user.email);

      if (!nim) {
        return false;
      }

      const roster = await prisma.studentRoster.findUnique({
        where: { nim },
        select: { isActive: true, nim: true },
      });

      if (!roster?.isActive) {
        return false;
      }

      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        // expose custom fields
        // @ts-expect-error custom
        session.user.nim = user.nim ?? null;
        // @ts-expect-error custom
        session.user.role = user.role;
      }
      return session;
    },
  },

  events: {
    async linkAccount({ user }) {
      if (!user.email) return;

      const nim = extractNimFromEmail(user.email);

      if (!nim) return;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { nim },
        });
      } catch {
      }
    },
  },
});
