"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Share2,
  Settings,
  CreditCard,
  LogOut,
  Users,
  Sparkles,
  User,
  Mail,
  Shield,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

interface Account {
  provider: string;
  type: string;
}

interface SettingsClientProps {
  user: UserData;
  subscription: Subscription | null;
  accounts: Account[];
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar", active: false },
  { icon: Share2, label: "Posts", href: "/dashboard/posts", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Users, label: "Accounts", href: "/dashboard/accounts", active: false },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing", active: false },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", active: true },
];

function GlowingOrb({
  color,
  size = 300,
  top,
  left,
  right,
  bottom,
  delay = 0,
}: {
  color: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
}) {
  const position = {
    ...(top && { top }),
    ...(left && { left }),
    ...(right && { right }),
    ...(bottom && { bottom }),
  };

  return (
    <div
      className="absolute rounded-full animate-pulse-glow pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
        opacity: 0.3,
        animationDelay: `${delay}s`,
        ...position,
      }}
    />
  );
}

export default function SettingsClient({ user, subscription, accounts }: SettingsClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [message, setMessage] = useState("");

  const planName = subscription?.plan || "free";
  const isPro = planName === "pro" || planName === "enterprise";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setMessage("Profile updated successfully!");
        router.refresh();
      } else {
        setMessage("Failed to update profile.");
      }
    } catch (error) {
      setMessage("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasGoogleAccount = accounts.some((acc) => acc.provider === "google");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GlowingOrb color="#ff00ff" size={300} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#00ffff" size={400} bottom="-10%" left="-5%" delay={2} />
        <GlowingOrb color="#a855f7" size={250} top="30%" right="20%" delay={4} />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header */}
      <header className="bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  SocialFlow
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <Avatar className="w-9 h-9 ring-2 ring-fuchsia-500/50">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white font-bold">
                    {user?.name?.[0] || user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">
                    {user?.name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="space-y-1">
              {navItems.map((item, i) => (
                <Link key={i} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      item.active
                        ? "bg-gradient-to-r from-fuchsia-600/80 to-purple-600/80 hover:from-fuchsia-500/80 hover:to-purple-500/80 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Account Settings ⚙️
              </h1>
              <p className="text-gray-400">
                Manage your account settings and connected services
              </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/80 data-[state=active]:to-purple-600/80 data-[state=active]:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/80 data-[state=active]:to-purple-600/80 data-[state=active]:text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/80 data-[state=active]:to-purple-600/80 data-[state=active]:text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-6">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your account profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 ring-2 ring-fuchsia-500/50">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white text-2xl font-bold">
                          {user?.name?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Change Avatar
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-300">
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-300">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={user.email}
                            disabled
                            className="bg-white/5 border-white/10 text-gray-400"
                          />
                        </div>
                      </div>

                      {message && (
                        <div className="flex items-center gap-2 text-lime-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          {message}
                        </div>
                      )}

                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4 mt-6">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Connected Accounts</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your connected authentication methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Google Account */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Google</p>
                          <p className="text-sm text-gray-400">
                            {hasGoogleAccount
                              ? "Connected ✓"
                              : "Not connected"}
                          </p>
                        </div>
                      </div>
                      {hasGoogleAccount ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          Connect
                        </Button>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-fuchsia-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Email</p>
                          <p className="text-sm text-gray-400">
                            {user.email} ✓
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-lime-500/30 text-lime-400"
                      >
                        Primary
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Irreversible actions for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Delete Account</p>
                        <p className="text-sm text-gray-400">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-4 mt-6">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Current Plan</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your subscription and billing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-cyan-600/20 rounded-xl border border-white/10">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white capitalize">
                            {planName} Plan
                          </h3>
                          <Badge
                            className={`${
                              isPro
                                ? "bg-gradient-to-r from-fuchsia-500 to-purple-500"
                                : "bg-white/10"
                            }`}
                          >
                            {isPro ? "Pro" : "Free"}
                          </Badge>
                        </div>
                        <p className="text-gray-400">
                          {isPro
                            ? `Renews on ${new Date(
                                subscription?.current_period_end || ""
                              ).toLocaleDateString()}`
                            : "Upgrade to unlock premium features"}
                        </p>
                      </div>
                      {!isPro ? (
                        <Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500">
                          Upgrade to Pro
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-white/20 bg-white/5"
                        >
                          Manage Subscription
                        </Button>
                      )}
                    </div>

                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium text-white">
                        Plan Features
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Unlimited social accounts",
                          "Advanced analytics",
                          "Priority support",
                          "Team collaboration",
                          "API access",
                        ].map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-gray-400"
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isPro ? "text-lime-400" : "text-gray-600"
                              }`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
