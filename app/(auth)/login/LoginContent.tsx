"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Chrome, Mail, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";

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
        opacity: 0.4,
        animationDelay: `${delay}s`,
        ...position,
      }}
    />
  );
}

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await signIn("google", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      setError("Google login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("otp", {
        email,
        action: "request",
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send verification code. Please try again.");
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("otp", {
        email,
        code: otpCode,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid or expired code. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GlowingOrb color="#ff00ff" size={400} top="-10%" left="-10%" delay={0} />
        <GlowingOrb color="#00ffff" size={500} bottom="-10%" right="-10%" delay={2} />
        <GlowingOrb color="#a855f7" size={300} top="40%" left="20%" delay={4} />
        <GlowingOrb color="#84cc16" size={350} top="20%" right="30%" delay={1} />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl rotate-12 opacity-20 animate-bounce-slow" />
        <div className="absolute bottom-32 right-20 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 animate-pulse" />
        <div className="absolute top-1/3 right-10 text-4xl animate-bounce-slow" style={{ animationDelay: "1s" }}>🔐</div>
        <div className="absolute bottom-1/4 left-10 text-3xl animate-pulse" style={{ animationDelay: "2s" }}>✨</div>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" />

        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>

          <div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome Back! 👋
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Sign in to your account to continue your journey
            </CardDescription>
          </div>
        </CardHeader>

        {error && (
          <div className="px-6 pb-4">
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="google"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-white"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              {!otpSent ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address 📧
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <>
                        Continue with Email
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-gray-300">
                      Verification Code 🔢
                    </Label>
                    <div className="relative">
                      <Input
                        id="otp"
                        type={showOtp ? "text" : "password"}
                        placeholder="123456"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOtp(!showOtp)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showOtp ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-fuchsia-400">{email}</span> 📨
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify ✨"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                    onClick={() => setOtpSent(false)}
                    disabled={isLoading}
                  >
                    ← Back to email
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="google" className="mt-4">
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  className="w-full border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white transition-all hover:scale-[1.02]"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Chrome className="mr-2 h-5 w-5 text-blue-400" />
                  Continue with Google
                </Button>
                <p className="mt-4 text-sm text-gray-400">
                  Quick and secure sign-in with your Google account 🔒
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator className="bg-white/10" />
          <p className="text-sm text-gray-400 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline font-medium transition-colors"
            >
              Sign up here 🚀
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
