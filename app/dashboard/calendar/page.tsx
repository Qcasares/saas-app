"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Share2, 
  Settings, 
  CreditCard, 
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Bell,
  Filter,
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

const platformIcons = {
  twitter: { icon: Twitter, color: "#1DA1F2" },
  instagram: { icon: Instagram, color: "#E4405F" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  tiktok: { icon: Share2, color: "#000000" },
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CalendarIcon, label: "Calendar", href: "/dashboard/calendar", active: true },
  { icon: Share2, label: "Posts", href: "/dashboard/posts" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Share2, label: "Accounts", href: "/dashboard/accounts" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface CalendarPost {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduled_at: string;
  published_at: string | null;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");

  const calendarStart = startOfWeek(startOfMonth(currentDate));
  const calendarEnd = endOfWeek(endOfMonth(currentDate));

  useEffect(() => {
    fetchPosts();
  }, [currentDate]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const start = format(calendarStart, "yyyy-MM-dd");
      const end = format(calendarEnd, "yyyy-MM-dd");
      const res = await fetch(`/api/posts/calendar?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterPlatform !== "all" && !post.platforms.includes(filterPlatform)) {
        return false;
      }
      if (filterStatus !== "all" && post.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [posts, filterPlatform, filterStatus]);

  function getPostsForDay(day: Date) {
    return filteredPosts.filter((post) => {
      const postDate = parseISO(post.scheduled_at || post.published_at || "");
      return isSameDay(postDate, day);
    });
  }

  function handlePrevMonth() {
    setCurrentDate(subMonths(currentDate, 1));
  }

  function handleNextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
  }

  async function handleDeletePost(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  }

  async function handleDuplicatePost(post: CalendarPost) {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          mediaUrls: [],
          platforms: post.platforms,
          status: "draft",
        }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to duplicate post:", error);
    }
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

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
                  Content Calendar 📅
                </h1>
                <p className="text-gray-400">Schedule and manage your posts</p>
              </div>

              <Link href="/dashboard/posts/new">
                <Button className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Filters:</span>
                  </div>

                  <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">
                    {format(currentDate, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} className="border-white/10 bg-white/5">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentDate(new Date())}
                      className="border-white/10 bg-white/5"
                    >
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="border-white/10 bg-white/5">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-white/10 rounded-lg overflow-hidden">
                  {/* Week day headers */}
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="bg-[#0a0a0f] p-3 text-center text-sm font-medium text-gray-400"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {loading ? (
                    Array(35).fill(0).map((_, i) => (
                      <div key={i} className="bg-[#0a0a0f] min-h-[120px] p-2">
                        <Skeleton className="h-6 w-6 bg-white/5" />
                      </div>
                    ))
                  ) : (
                    calendarDays.map((day, dayIdx) => {
                      const dayPosts = getPostsForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isToday_ = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "bg-[#0a0a0f] min-h-[120px] p-2 transition-colors",
                            !isCurrentMonth && "opacity-50",
                            "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={cn(
                                "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                                isToday_ && "bg-fuchsia-500 text-white font-bold",
                                !isToday_ && "text-gray-400"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                            {dayPosts.length > 0 && (
                              <span className="text-xs text-gray-500">{dayPosts.length}</span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {dayPosts.slice(0, 3).map((post) => (
                              <button
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded text-xs truncate transition-all",
                                  post.status === "published" && "bg-lime-500/20 text-lime-400 border border-lime-500/30",
                                  post.status === "pending" && "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
                                  post.status === "draft" && "bg-gray-500/20 text-gray-400 border border-gray-500/30",
                                  "hover:opacity-80"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  {post.platforms.slice(0, 2).map((p) => {
                                    const Icon = platformIcons[p as keyof typeof platformIcons]?.icon || Share2;
                                    return <Icon key={p} className="w-3 h-3" />;
                                  })}
                                  <span className="truncate">{post.content.slice(0, 30)}...</span>
                                </div>
                              </button>
                            ))}
                            {dayPosts.length > 3 && (
                              <button
                                onClick={() => {
                                  // Show all posts for this day
                                }}
                                className="w-full text-center text-xs text-gray-500 hover:text-gray-300"
                              >
                                +{dayPosts.length - 3} more
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-fuchsia-500/30 border border-fuchsia-500" />
                <span className="text-gray-400">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lime-500/30 border border-lime-500" />
                <span className="text-gray-400">Published</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500/30 border border-gray-500" />
                <span className="text-gray-400">Draft</span>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-lg">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Post Details
                  <Badge 
                    variant="outline"
                    className={cn(
                      selectedPost.status === "published" && "border-lime-500 text-lime-400",
                      selectedPost.status === "pending" && "border-fuchsia-500 text-fuchsia-400",
                      selectedPost.status === "draft" && "border-gray-500 text-gray-400",
                    )}
                  >
                    {selectedPost.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedPost.scheduled_at && format(parseISO(selectedPost.scheduled_at), "PPP 'at' p")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  {selectedPost.platforms.map((platform) => {
                    const config = platformIcons[platform as keyof typeof platformIcons];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div
                        key={platform}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1a2e] border-white/10">
                    <DropdownMenuItem 
                      onClick={() => router.push(`/dashboard/posts/${selectedPost.id}/edit`)}
                      className="text-white hover:bg-white/10"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDuplicatePost(selectedPost)}
                      className="text-white hover:bg-white/10"
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePost(selectedPost.id)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  onClick={() => router.push(`/dashboard/posts/${selectedPost.id}`)}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-600"
                >
                  View Full Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
