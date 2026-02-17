"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Share2, 
  Settings, 
  CreditCard, 
  LogOut, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Bell,
  ChevronDown,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Share2,
};

const platformColors = {
  twitter: "#1DA1F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  tiktok: "#000000",
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
  { icon: Share2, label: "Posts", href: "/dashboard/posts" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics", active: true },
  { icon: Users, label: "Accounts", href: "/dashboard/accounts" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface AnalyticsData {
  summary: {
    totalFollowers: number;
    totalPosts: number;
    connectedAccounts: number;
    period: number;
  };
  accounts: Array<{
    id: string;
    platform: string;
    account_name: string;
    followers_count: number;
    account_image: string;
  }>;
  followerGrowth: Array<{
    date: string;
    total_followers: number;
    platforms: string;
  }>;
  platformBreakdown: Array<{
    platform: string;
    followers: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    avg_engagement_rate: number;
  }>;
  engagementTrends: Array<{
    date: string;
    posts: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }

  async function handleExport() {
    try {
      const res = await fetch(`/api/analytics/export?format=csv&days=${timeRange}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  }

  // Prepare chart data
  const followerChartData = analytics?.followerGrowth.map((d) => ({
    date: format(new Date(d.date), "MMM dd"),
    followers: d.total_followers,
  })) || [];

  const platformChartData = analytics?.platformBreakdown.map((p) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: p.followers,
    color: platformColors[p.platform as keyof typeof platformColors] || "#8884d8",
  })) || [];

  const engagementChartData = analytics?.engagementTrends.map((d) => ({
    date: format(new Date(d.date), "MMM dd"),
    posts: d.posts,
  })) || [];

  const stats = [
    {
      label: "Total Followers",
      value: analytics?.summary.totalFollowers || 0,
      change: "+12%",
      trend: "up" as const,
      icon: Users,
      color: "from-fuchsia-500 to-purple-500",
    },
    {
      label: "Posts Published",
      value: analytics?.summary.totalPosts || 0,
      change: "+8%",
      trend: "up" as const,
      icon: Share2,
      color: "from-cyan-500 to-blue-500",
    },
    {
      label: "Connected Accounts",
      value: analytics?.summary.connectedAccounts || 0,
      change: "0%",
      trend: "up" as const,
      icon: LayoutDashboard,
      color: "from-lime-500 to-green-500",
    },
    {
      label: "Avg Engagement",
      value: "4.2%",
      change: "+0.5%",
      trend: "up" as const,
      icon: Heart,
      color: "from-orange-500 to-red-500",
    },
  ];

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
                  Analytics 📊
                </h1>
                <p className="text-gray-400">Track your social media performance</p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-white/10 bg-white/5"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="border-white/10 bg-white/5"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-28 bg-white/5" />
                ))
              ) : (
                stats.map((stat, i) => (
                  <Card key={i} className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">{stat.label}</p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {stat.label.includes("Engagement") ? stat.value : stat.value.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            {stat.trend === "up" ? (
                              <TrendingUp className="w-4 h-4 text-lime-400" />
                            ) : stat.trend === "down" ? (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            ) : null}
                            <span className={`text-sm ${
                              stat.trend === "up" ? "text-lime-400" : 
                              stat.trend === "down" ? "text-red-400" : "text-gray-400"
                            }`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Charts */}
            <Tabs defaultValue="growth" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="growth" className="data-[state=active]:bg-white/10">Follower Growth</TabsTrigger>
                <TabsTrigger value="platforms" className="data-[state=active]:bg-white/10">Platforms</TabsTrigger>
                <TabsTrigger value="engagement" className="data-[state=active]:bg-white/10">Engagement</TabsTrigger>
              </TabsList>

              <TabsContent value="growth" className="mt-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Follower Growth</CardTitle>
                    <CardDescription className="text-gray-400">
                      Total followers across all platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {loading ? (
                        <Skeleton className="h-full bg-white/5" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={followerChartData}>
                            <defs>
                              <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="date" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1a1a2e', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="followers" 
                              stroke="#a855f7" 
                              fillOpacity={1} 
                              fill="url(#colorFollowers)" 
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="platforms" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Followers by Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {loading ? (
                          <Skeleton className="h-full bg-white/5" />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={platformChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {platformChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1a1a2e', 
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Platform Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          Array(4).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-16 bg-white/5" />
                          ))
                        ) : (
                          analytics?.platformBreakdown.map((platform) => {
                            const Icon = platformIcons[platform.platform as keyof typeof platformIcons] || Share2;
                            const color = platformColors[platform.platform as keyof typeof platformColors] || "#8884d8";
                            
                            return (
                              <div key={platform.platform} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white capitalize">{platform.platform}</p>
                                    <p className="text-sm text-gray-400">{platform.followers.toLocaleString()} followers</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-medium">{(platform.avg_engagement_rate * 100).toFixed(1)}%</p>
                                  <p className="text-sm text-gray-400">engagement</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="engagement" className="mt-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Posts Published</CardTitle>
                    <CardDescription className="text-gray-400">
                      Number of posts published over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {loading ? (
                        <Skeleton className="h-full bg-white/5" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engagementChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="date" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1a1a2e', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="posts" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
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
