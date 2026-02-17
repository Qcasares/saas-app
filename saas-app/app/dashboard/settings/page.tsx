import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user data from D1
  const env = process.env as any;
  const db = env.DB as any | undefined;

  let subscription = null;
  let accounts: any[] = [];

  if (db) {
    try {
      // Fetch subscription
      subscription = await db
        .prepare("SELECT * FROM subscriptions WHERE user_id = ?")
        .bind(session.user.id)
        .first();

      // Fetch connected OAuth accounts
      const accountsResult = await db
        .prepare("SELECT * FROM accounts WHERE user_id = ?")
        .bind(session.user.id)
        .all();

      accounts = accountsResult.results || [];
    } catch (error) {
      console.error("Error fetching settings data:", error);
    }
  }

  return (
    <SettingsClient
      user={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }}
      subscription={subscription}
      accounts={accounts}
    />
  );
}
