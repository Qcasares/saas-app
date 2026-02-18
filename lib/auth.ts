import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extend types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8787";

// Helper to call Worker API
async function workerFetch(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response;
}

// NextAuth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        action: { label: "Action", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const { email, code, action } = credentials as {
          email: string;
          code?: string;
          action?: string;
        };

        // If action is "request", call Worker to generate and send OTP
        if (action === "request") {
          try {
            const response = await workerFetch("/auth/otp/request", { email });
            if (!response.ok) {
              console.error("OTP request failed:", await response.text());
              return null;
            }
            // Return a temporary user object to indicate OTP was sent
            return { id: "temp", email, otpRequested: true } as User;
          } catch (error) {
            console.error("OTP request error:", error);
            return null;
          }
        }

        // If code is provided, call Worker to verify OTP
        if (code) {
          try {
            const response = await workerFetch("/auth/otp/verify", {
              email,
              code,
            });

            if (!response.ok) {
              console.error("OTP verify failed:", await response.text());
              return null;
            }

            const data = (await response.json()) as {
              user: { id: string; email: string; name: string | null; image: string | null };
            };

            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              image: data.user.image,
            } as User;
          } catch (error) {
            console.error("OTP verify error:", error);
            return null;
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, ensure user exists in Worker DB
      if (account?.provider === "google" && user?.email) {
        try {
          await workerFetch("/auth/sync-user", {
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          });
        } catch (error) {
          console.error("Error syncing Google OAuth user:", error);
          // Allow sign-in to proceed even if sync fails
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          // For Google OAuth, resolve the local DB user ID via Worker
          try {
            const response = await workerFetch("/auth/sync-user", {
              email: user.email,
            });

            if (response.ok) {
              const data = (await response.json()) as {
                user: { id: string; name: string | null; image: string | null };
              };
              token.id = data.user.id;
              token.email = user.email;
              token.name = data.user.name || user.name;
              token.image = data.user.image || user.image;
              return token;
            }
          } catch (error) {
            console.error("Error looking up Google OAuth user:", error);
          }

          // Fallback: use Google profile data directly
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
        } else {
          // For OTP credentials, user.id is already the local DB ID
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) || null;
        session.user.image = (token.image as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  events: {
    async signIn({ user }) {
      console.log("User signed in:", user.email);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
