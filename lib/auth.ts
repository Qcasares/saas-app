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

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send OTP email
async function sendOTPEmail(
  email: string,
  code: string,
  resendApiKey: string
) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@socialflow.app",
        to: email,
        subject: "Your SocialFlow Login Code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="background: linear-gradient(135deg, #ff00ff, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">
                ✨ SocialFlow
              </h1>
            </div>
            <h2 style="color: #333; margin-bottom: 10px;">Your Login Code</h2>
            <p style="color: #666; margin-bottom: 20px;">Use the following code to log in:</p>
            <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
              <span style="font-size: 40px; letter-spacing: 12px; font-weight: bold; background: linear-gradient(135deg, #ff00ff, #00ffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${code}
              </span>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">This code expires in 10 minutes.</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
      throw new Error("Failed to send email");
    }

    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
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

        const { email, code, action, name } = credentials as {
          email: string;
          code?: string;
          action?: string;
          name?: string;
        };

        // Get D1 database from environment
        const env = process.env as any;
        const db = env.DB as any | undefined;

        if (!db) {
          console.error("D1 database not configured");
          return null;
        }

        // If action is "request", generate and send OTP
        if (action === "request") {
          const otpCode = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

          // Invalidate existing unused OTPs for this email
          await db
            .prepare(
              "UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0"
            )
            .bind(email)
            .run();

          // Store new OTP
          await db
            .prepare(
              "INSERT INTO otp_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)"
            )
            .bind(crypto.randomUUID(), email, otpCode, expiresAt)
            .run();

          // Send email
          if (process.env.RESEND_API_KEY) {
            await sendOTPEmail(email, otpCode, process.env.RESEND_API_KEY);
          } else {
            console.log(`OTP for ${email}: ${otpCode}`);
          }

          // Return a temporary user object to indicate success
          return { id: "temp", email, otpRequested: true } as User;
        }

        // If code is provided, verify it
        if (code) {
          const otpRecord = await db
            .prepare(
              "SELECT * FROM otp_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')"
            )
            .bind(email, code)
            .first();

          if (!otpRecord) {
            return null;
          }

          // Mark OTP as used
          await db
            .prepare("UPDATE otp_codes SET used = 1 WHERE id = ?")
            .bind((otpRecord as any).id)
            .run();

          // Find or create user
          let user = await db
            .prepare("SELECT * FROM users WHERE email = ?")
            .bind(email)
            .first();

          if (!user) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await db
              .prepare(
                "INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
              )
              .bind(id, email, name || null, now, now)
              .run();

            // Create default subscription
            await db
              .prepare(
                "INSERT INTO subscriptions (id, user_id, plan, status, created_at) VALUES (?, ?, 'free', 'active', ?)"
              )
              .bind(crypto.randomUUID(), id, now)
              .run();

            user = { id, email, name: name || null, image: null };
          }

          return {
            id: (user as any).id,
            email: (user as any).email,
            name: (user as any).name,
            image: (user as any).image,
          } as User;
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
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
    async signIn({ user, account, isNewUser }) {
      console.log("User signed in:", user.email);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
