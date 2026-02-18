import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "trader" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Mock User for MVP
        // In production, fetch from backend API
        if (credentials.username === "user" && credentials.password === "password") {
          return { id: "1", name: "Pro Trader", email: "trader@fx.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-change-me",
});

export { handler as GET, handler as POST };
