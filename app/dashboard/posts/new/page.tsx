"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon,
  Clock,
  Twitter,
  Instagram,
  Linkedin,
  Share2,
  ChevronLeft,
  Image as ImageIcon,
  Video,
  X,
  Plus,
  Sparkles,
  Wand2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_image: string;
}

const platformConfigs: Record<string, { name: string; icon: React.ElementType; color: string; maxChars: number }> = {
  twitter: {
    name: "Twitter/X",
    icon: Twitter,
    color: "#1DA1F2",
    maxChars: 280,
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    maxChars: 2200,
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    maxChars: 3000,
  },
  tiktok: {
    name: "TikTok",
    icon: Share2,
    color: "#000000",
    maxChars: 2200,
  },
};

export default function NewPostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [mediaFiles, setMediaFiles] = useState<Array<{ url: string; type: string }>>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [threadMode, setThreadMode] = useState(false);
  const [threadPosts, setThreadPosts] = useState<Array<{ content: string }>>([{ content: "" }]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    // In production, this would upload to R2 and return URLs
    // For now, create object URLs for preview
    const newFiles = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
    }));

    setMediaFiles((prev) => [...prev, ...newFiles]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(schedule = false) {
    if (selectedPlatforms.length === 0) return;

    setLoading(true);
    try {
      const scheduledAt = schedule && scheduledDate
        ? new Date(
            `${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`
          ).toISOString()
        : null;

      const body: any = {
        content,
        mediaUrls: mediaFiles.map((m) => m.url),
        platforms: selectedPlatforms,
        status: schedule ? "scheduled" : "draft",
        scheduledAt,
        isThread: threadMode,
        threadPosts: threadMode ? threadPosts : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(schedule ? "/dashboard/calendar" : "/dashboard/posts");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Create post error:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    try {
      // In production, this would call an AI service
      // For now, simulate generation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const generatedContent = `🚀 ${aiPrompt}\n\nHere's some engaging content generated for your audience. Make sure to customize it for each platform!\n\n#content #socialmedia #marketing`;
      
      setContent(generatedContent);
      setShowAiDialog(false);
      setAiPrompt("");
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setAiGenerating(false);
    }
  }

  function addThreadPost() {
    setThreadPosts([...threadPosts, { content: "" }]);
  }

  function updateThreadPost(index: number, content: string) {
    const updated = [...threadPosts];
    updated[index] = { content };
    setThreadPosts(updated);
  }

  function removeThreadPost(index: number) {
    setThreadPosts(threadPosts.filter((_, i) => i !== index));
  }

  const minChars = Math.min(
    ...selectedPlatforms.map((p) => platformConfigs[p]?.maxChars || 280)
  ) || 280;
  const charCount = content.length;
  const isOverLimit = charCount > minChars;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/posts">
              <Button variant="ghost" size="icon" className="text-gray-400">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Create Post ✨
              </h1>
              <p className="text-gray-400">Craft your message for multiple platforms</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAiDialog(true)}
            className="border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/10"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            AI Assist
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Content</CardTitle>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={threadMode}
                        onChange={(e) => setThreadMode(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Thread Mode
                    </label>
                    <span className={cn(
                      "text-sm",
                      isOverLimit ? "text-red-400" : "text-gray-400"
                    )}>
                      {charCount}/{minChars}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!threadMode ? (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind? Write something engaging..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                  />
                ) : (
                  <div className="space-y-4">
                    {threadPosts.map((post, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 top-0 flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-fuchsia-500" />
                          {index < threadPosts.length - 1 && (
                            <div className="w-0.5 h-full bg-fuchsia-500/30 mt-1" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            value={post.content}
                            onChange={(e) => updateThreadPost(index, e.target.value)}
                            placeholder={`Tweet ${index + 1}...`}
                            className="flex-1 min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                          />
                          {threadPosts.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeThreadPost(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={addThreadPost}
                      className="w-full border-dashed border-white/20"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Thread
                    </Button>
                  </div>
                )}

                {/* Media Upload */}
                <div className="space-y-3">
                  <Label className="text-gray-400">Media</Label>
                  
                  <div className="flex flex-wrap gap-3">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type === "image" ? (
                          <img
                            src={file.url}
                            alt=""
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="w-24 h-24 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-500 mb-1" />
                      <span className="text-xs text-gray-500">Add Media</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(platformConfigs).map(([key, config]) => {
                  const isConnected = accounts.some((a) => a.platform === key);
                  const isSelected = selectedPlatforms.includes(key);
                  const Icon = config.icon;

                  return (
                    <button
                      key={key}
                      onClick={() => isConnected && togglePlatform(key)}
                      disabled={!isConnected}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                        isSelected
                          ? "bg-white/10 border-fuchsia-500/50"
                          : "bg-white/5 border-white/10 hover:border-white/20",
                        !isConnected && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{config.name}</p>
                        <p className="text-xs text-gray-400">
                          {isConnected ? "Connected" : "Not connected"}
                        </p>
                      </div>

                      {isSelected && (
                        <Badge className="bg-fuchsia-500">Selected</Badge>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/5 border-white/10"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1a1a2e] border-white/10">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400">Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={loading || selectedPlatforms.length === 0 || !content.trim()}
                className="w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule Post
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleSubmit(false)}
                disabled={savingDraft || selectedPlatforms.length === 0}
                variant="outline"
                className="w-full border-white/10"
              >
                {savingDraft ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Save as Draft"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assist Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              AI Content Assistant
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Describe what you want to write about and AI will help you create engaging content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Announce our new product launch for a SaaS social media tool..."
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />

            <div className="flex gap-2">
              {["Promotional", "Educational", "Engagement", "Announcement"].map((tone) => (
                <Badge
                  key={tone}
                  variant="outline"
                  className="cursor-pointer border-white/20 hover:border-fuchsia-500"
                  onClick={() => setAiPrompt((p) => `${p} (${tone.toLowerCase()} tone)` )}
                >
                  {tone}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowAiDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
