import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { loginSchema } from './auth.schemas';
import { validateCredentials } from './auth.service';
import type { SessionUser } from './auth.types';

// ---------------------------------------------------------------------------
// NextAuth v5 configuration
// ---------------------------------------------------------------------------

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await validateCredentials(
          parsed.data.email,
          parsed.data.password,
        );

        if (!user) return null;

        // NextAuth expects an object with at least `id`.
        // Extra fields (role) are forwarded through the jwt callback below.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    /**
     * Persist custom fields (id, role) into the JWT so they survive across
     * requests without extra DB lookups.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as SessionUser).role;
      }
      return token;
    },

    /**
     * Expose the custom fields to the client-side `useSession()` and
     * server-side `auth()` calls.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as SessionUser).role = token.role as SessionUser['role'];
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
