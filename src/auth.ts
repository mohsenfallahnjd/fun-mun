import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password || !process.env.DATABASE_URL) {
          return null;
        }

        const db = getDb();
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.email, email),
        });

        if (!profile?.passwordHash) {
          return null;
        }

        const valid = await compare(password, profile.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name ?? profile.email,
          image: profile.imageUrl,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
