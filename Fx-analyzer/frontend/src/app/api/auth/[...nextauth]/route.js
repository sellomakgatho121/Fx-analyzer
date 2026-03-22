import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "trader@fx.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiKey = process.env.API_KEY || 'fx-analyzer-secure-key-2026';
          const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-api-key": apiKey
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const user = await res.json();
          return user;
        } catch (err) {
          console.error("Auth fetch error:", err);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        const adminEmails = ["sellomakgatho121@gmail.com", "blacksunstar999@gmail.com"];
        if (adminEmails.includes(user.email)) {
          return true; // Allow owners unconditionally
        }

        // Check if regular user has paid/exists in DB
        const apiKey = process.env.API_KEY || 'fx-analyzer-secure-key-2026';
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/check-user?email=${encodeURIComponent(user.email)}`, {
            headers: { "x-api-key": apiKey }
          });
          
          if (res.ok) {
            const dbUser = await res.json();
            if (dbUser.subscription_status === 'active') {
              // Store DB role in NextAuth user object temporarily to sync in jwt callback
              user.role = dbUser.role;
              return true; 
            }
          }
          // Redirect unauthorized / unpaid Google users back to pricing
          return "/#pricing"; 
        } catch (err) {
          console.error("Google SSO DB Check failed:", err);
          return false;
        }
      }
      return true; // Credentials route handles its own logic
    },
    async jwt({ token, user, account }) {
      if (user) {
        const adminEmails = ["sellomakgatho121@gmail.com", "blacksunstar999@gmail.com"];
        
        if (account?.provider === "google") {
          if (adminEmails.includes(user.email)) {
            token.role = "admin";
            token.subscription = "active";
          } else {
            // Normal user already passed the signIn active check
            token.role = user.role || "user";
            token.subscription = "active";
          }
        } else {
          // Credentials flow
          token.role = user.role;
          token.subscription = user.subscription;
        }
        token.id = user.id || user.email; // Use email as ID for Google if missing DB ID
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.subscription = token.subscription;
      }
      return session;
    }
  },
  session: {
      strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-change-me",
});

export { handler as GET, handler as POST };
