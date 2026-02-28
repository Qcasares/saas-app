"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const platformIcons = {
  twitter: { icon: Twitter, color: "#1DA1F2" },
  instagram: { icon: Instagram, color: "#E4405F" },
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  tiktok: { icon: Share2, color: "#000000" },
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
  { icon: Share2, label: "Posts", href: "/dashboard/posts", active: true },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Share2, label: "Accounts", href: "/dashboard/accounts" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface Post {
  id: string;
  content: string;
  media_urls: string[];
  platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_ids: Record<string, string> | null;
  comment_count: number;
}

export default function PostsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, currentPage]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", "20");
      params.append("offset", String((currentPage - 1) * 20));
      
      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectPost(postId: string) {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  }

  function toggleSelectAll() {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map((p) => p.id)));
    }
  }

  async function handleBulkDelete() {
    try {
      const res = await fetch("/api/posts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedPosts) }),
      });
      if (res.ok) {
        setPosts(posts.filter((p) => !selectedPosts.has(p.id)));
        setSelectedPosts(new Set());
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  }

  async function handleDelete() {
    if (!deletePost) return;
    
    try {
      const res = await fetch(`/api/posts/${deletePost.id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== deletePost.id));
        setDeletePost(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  async function handleDuplicate(post: Post) {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          mediaUrls: post.media_urls,
          platforms: post.platforms,
          status: "draft",
        }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Duplicate failed:", error);
    }
  }

  const filteredPosts = posts.filter((post) =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-lime-500/20 text-lime-400 border-lime-500/30";
      case "pending":
        return "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-white/10 text-gray-400 border-white/10";
    }
  };

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
                  Posts 📝
                </h1>
                <p className="text-gray-400">Manage and schedule your content</p>
              </div>

              <Link href="/dashboard/posts/new">
                <Button className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </Link>
            </div>

            {/* Filters & Search */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Drafts</option>
                      <option value="pending">Scheduled</option>
                      <option value="published">Published</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedPosts.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg">
                <span className="text-fuchsia-400">{selectedPosts.size} selected</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPosts(new Set())}
                  className="text-gray-400"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Posts List */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-24 bg-white/5" />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Share2 className="w-10 h-10 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-lg">No posts found</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first post to get started</p>
                    <Link href="/dashboard/posts/new">
                      <Button className="mt-6 bg-gradient-to-r from-fuchsia-600 to-purple-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-white/10 text-sm text-gray-400">
                      <Checkbox 
                        checked={selectedPosts.size === posts.length && posts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span>Post</span>
                      <span>Status & Actions</span>
                    </div>

                    <div className="divide-y divide-white/10">
                      {filteredPosts.map((post) => (
                        <div 
                          key={post.id} 
                          className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center">
                            <Checkbox 
                              checked={selectedPosts.has(post.id)}
                              onCheckedChange={() => toggleSelectPost(post.id)}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-white truncate">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                {post.platforms.map((platform) => {
                                  const config = platformIcons[platform as keyof typeof platformIcons];
                                  if (!config) return null;
                                  const Icon = config.icon;
                                  return (
                                    <Icon 
                                      key={platform} 
                                      className="w-4 h-4" 
                                      style={{ color: config.color }}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-xs text-gray-500">
                                {post.scheduled_at && format(parseISO(post.scheduled_at), "PPp")}
                                {post.published_at && format(parseISO(post.published_at), "PPp")}
                              </span>
                              {post.comment_count > 0 && (
                                <span className="text-xs text-gray-500">
                                  {post.comment_count} comments
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#1a1a2e] border-white/10">
                                <DropdownMenuItem 
                                  onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                                  className="text-white hover:bg-white/10"
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                {post.status !== "published" && (
                                  <DropdownMenuItem 
                                    onClick={() => router.push(`/dashboard/posts/${post.id}/edit`)}
                                    className="text-white hover:bg-white/10"
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDuplicate(post)}
                                  className="text-white hover:bg-white/10"
                                >
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletePost(post)}
                                  className="text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {(currentPage > 1 || hasMore) && (
                      <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-white/10"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-gray-400">Page {currentPage}</span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={!hasMore}
                          className="border-white/10"
                        >
                          Next
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
