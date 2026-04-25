import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const authSecrets = [
  process.env.AUTH_SECRET,
  process.env.AUTH_SECRET_1,
  process.env.AUTH_SECRET_2,
  process.env.AUTH_SECRET_3,
  process.env.NEXTAUTH_SECRET,
].filter((value): value is string => Boolean(value));

const { handlers, auth: baseAuth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecrets.length === 1 ? authSecrets[0] : authSecrets,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name;
      }
      return session;
    },
  },
});

function isJwtSessionError(error: unknown): error is AuthError & { type: "JWTSessionError" } {
  return error instanceof AuthError && error.type === "JWTSessionError";
}

export const auth = (async (...args: Parameters<typeof baseAuth>) => {
  if (args.length > 0) {
    return baseAuth(...args);
  }

  try {
    return await baseAuth();
  } catch (error) {
    if (isJwtSessionError(error)) {
      return null;
    }
    throw error;
  }
}) as typeof baseAuth;

export { handlers, signIn, signOut };

export { AuthError };
