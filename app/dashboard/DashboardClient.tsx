"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Share2,
  Settings,
  CreditCard,
  LogOut,
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Zap,
  Bell,
  CheckCircle2,
} from "lucide-react";

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

interface DashboardStats {
  totalFollowers: number;
  totalEngagement: number;
  postsThisPeriod: number;
  scheduledPosts: number;
  connectedAccounts: number;
  engagementChange: number;
}

interface User {
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

interface SocialAccount {
  platform: string;
  account_name: string;
  followers_count: number;
}

const socialPlatforms = [
  {
    name: "Twitter",
    icon: Twitter,
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-500",
    key: "twitter",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-600",
    bgColor: "bg-gradient-to-br from-pink-500 to-purple-600",
    key: "instagram",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-700",
    key: "linkedin",
  },
  {
    name: "TikTok",
    icon: Share2,
    color: "from-gray-700 to-black",
    bgColor: "bg-black",
    key: "tiktok",
  },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar", active: false },
  { icon: Share2, label: "Posts", href: "/dashboard/posts", active: false },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: false },
  { icon: Users, label: "Accounts", href: "/dashboard/accounts", active: false },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing", active: false },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", active: false },
];

interface DashboardClientProps {
  user: User;
  subscription: Subscription | null;
  connectedAccounts: SocialAccount[];
}

export default function DashboardClient({
  user,
  subscription,
  connectedAccounts,
}: DashboardClientProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Calculate stats
  const totalFollowers = connectedAccounts.reduce(
    (sum, acc) => sum + (acc.followers_count || 0),
    0
  );

  const stats: DashboardStats = {
    totalFollowers,
    totalEngagement: 0,
    postsThisPeriod: 0,
    scheduledPosts: 0,
    connectedAccounts: connectedAccounts.length,
    engagementChange: 0,
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  const planName = subscription?.plan || "free";
  const isPro = planName === "pro" || planName === "enterprise";

  // Map connected accounts to platforms
  const connectedPlatforms = new Set(
    connectedAccounts.map((acc) => acc.platform)
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GlowingOrb color="#ff00ff" size={300} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#00ffff" size={400} bottom="-10%" left="-5%" delay={2} />
        <GlowingOrb color="#a855f7" size={250} top="30%" right="20%" delay={4} />

        {/* Grid Pattern */}
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
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></span>
              </Button>

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

            {/* Plan Card */}
            <Card className="mt-8 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-cyan-600/20 border-white/10 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-white capitalize">
                    {planName} Plan {isPro ? "🚀" : "✨"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  {isPro
                    ? "You have unlimited posts and advanced analytics!"
                    : "Upgrade to unlock unlimited posts and advanced analytics!"}
                </p>
                {!isPro && (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0"
                  >
                    Upgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Dashboard ✨
                </h1>
                <p className="text-gray-400">
                  Welcome back,{" "}
                  <span className="text-fuchsia-400 font-medium">
                    {user?.name || user?.email?.split("@")[0]}
                  </span>
                  ! Ready to create some magic? 🎨
                </p>
              </div>

              <Link href="/dashboard/posts/new">
                <Button className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post 📝
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Followers",
                  value: stats?.totalFollowers.toLocaleString() || "0",
                  change: "+12%",
                  trend: "up",
                  icon: Users,
                  color: "from-fuchsia-500 to-purple-500",
                },
                {
                  label: "Engagement",
                  value: stats?.totalEngagement.toLocaleString() || "0",
                  change: `${(stats?.engagementChange || 0) >= 0 ? "+" : ""}${
                    stats?.engagementChange || 0
                  }%`,
                  trend: (stats?.engagementChange || 0) >= 0 ? "up" : "down",
                  icon: TrendingUp,
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  label: "Posts This Month",
                  value: stats?.postsThisPeriod.toString() || "0",
                  change: "+5",
                  trend: "up",
                  icon: Share2,
                  color: "from-lime-500 to-green-500",
                },
                {
                  label: "Connected",
                  value: stats?.connectedAccounts.toString() || "0",
                  change: `${4 - (stats?.connectedAccounts || 0)} remaining`,
                  trend: "neutral",
                  icon: CheckCircle2,
                  color: "from-orange-500 to-red-500",
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="group bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 overflow-hidden relative"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-gray-400">
                        {stat.label}
                      </CardDescription>
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
                      >
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-black text-white mt-2">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-lime-400" />
                      ) : stat.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === "up"
                            ? "text-lime-400"
                            : stat.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Connected Accounts */}
            <Tabs defaultValue="accounts" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger
                  value="accounts"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/80 data-[state=active]:to-purple-600/80 data-[state=active]:text-white"
                >
                  Connected Accounts 🔗
                </TabsTrigger>
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/80 data-[state=active]:to-purple-600/80 data-[state=active]:text-white"
                >
                  Recent Activity 📊
                </TabsTrigger>
              </TabsList>

              <TabsContent value="accounts">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Your Connected Accounts 🌐
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your social media connections and expand your reach
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {socialPlatforms.map((platform) => {
                      const isConnected = connectedPlatforms.has(platform.key);
                      const account = connectedAccounts.find(
                        (acc) => acc.platform === platform.key
                      );

                      return (
                        <div
                          key={platform.key}
                          className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                            >
                              <platform.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-white">
                                {platform.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {isConnected ? (
                                  <>
                                    Connected ✓{" "}
                                    {account?.followers_count
                                      ? `• ${account.followers_count.toLocaleString()} followers`
                                      : ""}
                                  </>
                                ) : (
                                  "Not connected"
                                )}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant={isConnected ? "secondary" : "outline"}
                            size="sm"
                            className={
                              isConnected
                                ? "bg-lime-500/20 text-lime-400 border-lime-500/30 hover:bg-lime-500/30"
                                : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40"
                            }
                          >
                            {isConnected ? "Connected" : "Connect"}
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recent">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity 📈</CardTitle>
                    <CardDescription className="text-gray-400">
                      Your latest actions and updates
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-lg">
                        No recent activity yet 📝
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Start creating posts to see your activity here!
                      </p>
                      <Link href="/dashboard/posts/new">
                        <Button className="mt-6 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0">
                          Create Your First Post 🚀
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-fuchsia-600/10 via-purple-600/10 to-cyan-600/10 border-white/10 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-2">
                      Pro Tip 💡
                    </h3>
                    <p className="text-gray-400">
                      Connect all your social accounts to maximize your reach!
                      Posts shared across multiple platforms get{" "}
                      <span className="text-fuchsia-400 font-bold">
                        3x more engagement
                      </span>{" "}
                      on average. Start by connecting your most active accounts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
