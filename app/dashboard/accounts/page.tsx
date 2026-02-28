"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Share2, 
  Settings, 
  CreditCard, 
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Bell,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
  { icon: Share2, label: "Posts", href: "/dashboard/posts" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Share2, label: "Accounts", href: "/dashboard/accounts", active: true },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface SocialAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  account_image: string;
  account_username: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_active: number;
  created_at: string;
}

const platformConfigs: Record<string, { 
  name: string; 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  connectUrl: string;
}> = {
  twitter: {
    name: "Twitter/X",
    icon: Twitter,
    color: "#1DA1F2",
    bgColor: "bg-[#1DA1F2]/20",
    connectUrl: "/api/social/connect/twitter",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-[#E4405F]/20",
    connectUrl: "/api/social/connect/instagram",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-[#0A66C2]/20",
    connectUrl: "/api/social/connect/linkedin",
  },
  tiktok: {
    name: "TikTok",
    icon: Share2,
    color: "#000000",
    bgColor: "bg-gray-800",
    connectUrl: "/api/social/connect/tiktok",
  },
};

export default function AccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialAccount | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh(accountId: string) {
    setRefreshing(accountId);
    try {
      const res = await fetch(`/api/social/accounts/${accountId}/refresh`, { method: "POST" });
      if (res.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error("Failed to refresh account:", error);
    } finally {
      setRefreshing(null);
    }
  }

  async function handleDisconnect() {
    if (!disconnecting) return;
    
    try {
      const res = await fetch(`/api/social/accounts/${disconnecting.id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== disconnecting.id));
      }
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    } finally {
      setDisconnecting(null);
    }
  }

  function handleConnect(platform: string) {
    const config = platformConfigs[platform];
    if (config) {
      window.location.href = config.connectUrl;
    }
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header */}
      <header className="bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center mr-3">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  SocialFlow
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-fuchsia-500 rounded-full" />
              </Button>

              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold">{session?.user?.name?.[0] || "U"}</span>
                </div>
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
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      item.active
                        ? "bg-gradient-to-r from-fuchsia-600/80 to-purple-600/80 text-white"
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Connected Accounts 🔗
                </h1>
                <p className="text-gray-400">Manage your social media connections</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Connected Accounts</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {accounts.length}/4
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-fuchsia-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Followers</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Posts</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {accounts.reduce((sum, a) => sum + (a.posts_count || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-lime-500/20 flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-lime-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connected Accounts */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Your Connected Accounts</CardTitle>
                <CardDescription className="text-gray-400">
                  Click connect to add a new social media account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 bg-white/5" />
                  ))
                ) : (
                  Object.entries(platformConfigs).map(([key, config]) => {
                    const account = accounts.find((a) => a.platform === key);
                    const Icon = config.icon;

                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          account
                            ? "bg-white/5 border-white/10"
                            : "bg-white/[0.02] border-white/5 border-dashed"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}15` }}
                          >
                            <Icon className="w-7 h-7" style={{ color: config.color }} />
                          </div>

                          <div>
                            <p className="font-bold text-white text-lg">{config.name}</p>
                            {account ? (
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span>@{account.account_username || account.account_name}</span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {account.followers_count?.toLocaleString() || 0}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Not connected</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {account ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRefresh(account.id)}
                                disabled={refreshing === account.id}
                                className="border-white/10 bg-white/5"
                              >
                                <RefreshCw className={cn("h-4 w-4", refreshing === account.id && "animate-spin")} />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setDisconnecting(account)}
                                className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleConnect(key)}
                              className="bg-gradient-to-r from-fuchsia-600 to-purple-600"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Platform Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-fuchsia-600/10 via-purple-600/10 to-cyan-600/10 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-fuchsia-400" />
                    Why Connect Multiple Platforms?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 shrink-0" />
                      <span>Cross-post to all platforms with one click</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 shrink-0" />
                      <span>Unified analytics across all accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 shrink-0" />
                      <span>Schedule posts for optimal times per platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 mt-0.5 shrink-0" />
                      <span>Track follower growth and engagement metrics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active Connections</span>
                      <span className="text-white font-bold">{accounts.filter(a => a.is_active).length}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(accounts.length / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {accounts.length === 0 && "Connect your first account to get started"}
                      {accounts.length > 0 && accounts.length < 4 && `Connect ${4 - accounts.length} more to reach all platforms`}
                      {accounts.length === 4 && "All platforms connected! 🎉"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Disconnect Dialog */}
      <AlertDialog open={!!disconnecting} onOpenChange={() => setDisconnecting(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the connection to your {disconnecting && platformConfigs[disconnecting.platform]?.name} account.
              Your scheduled posts will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
