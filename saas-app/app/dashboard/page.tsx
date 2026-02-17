import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

// Server component that fetches user data
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch additional user data from D1
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

      // Fetch connected social accounts
      const accountsResult = await db
        .prepare("SELECT * FROM social_accounts WHERE user_id = ?")
        .bind(session.user.id)
        .all();

      accounts = accountsResult.results || [];
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  return (
    <DashboardClient
      user={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }}
      subscription={subscription}
      connectedAccounts={accounts}
    />
  );
}
