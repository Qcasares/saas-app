"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Zap, Shield, Sparkles, Star, CheckCircle2, CalendarDays, BarChart3, Share2, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function GlowingOrb({ 
  color, 
  size = 300, 
  top, 
  left, 
  right, 
  bottom,
  delay = 0
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
        filter: 'blur(60px)',
        opacity: 0.5,
        animationDelay: `${delay}s`,
        ...position,
      }}
    />
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GlowingOrb color="#ff00ff" size={400} top="-10%" left="-10%" delay={0} />
        <GlowingOrb color="#00ffff" size={500} top="20%" right="-15%" delay={2} />
        <GlowingOrb color="#a855f7" size={350} bottom="10%" left="20%" delay={4} />
        <GlowingOrb color="#84cc16" size={400} bottom="-5%" right="10%" delay={1} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-lg sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center mr-2">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            SocialFlow ✨
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#features">
            Features 🎯
          </Link>
          <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#pricing">
            Pricing 💎
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Log In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0">
              Get Started 🚀
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          {/* Floating decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl rotate-12 opacity-20 animate-bounce-slow" />
            <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 animate-pulse" />
            <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-gradient-to-br from-lime-400 to-green-500 rounded-3xl -rotate-12 opacity-20 animate-float" />
            <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce-slow" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute bottom-1/3 left-10 text-3xl animate-pulse" style={{ animationDelay: '2s' }}>🚀</div>
            <div className="absolute top-1/2 right-10 text-4xl animate-bounce-slow" style={{ animationDelay: '0.5s' }}>💫</div>
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <Badge 
              variant="secondary" 
              className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400 animate-pulse" />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                Now in Public Beta 🎉
              </span>
            </Badge>
            
            <h1 className={`text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="block mb-2 text-white">Manage Social Media</span>
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Like Magic ✨
              </span>
            </h1>
            
            <p className={`text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Schedule posts, track analytics, and grow your audience across all platforms. 
              One dashboard to rule them all! 🚀
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="px-10 py-7 text-lg font-bold group bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all hover:scale-105"
                >
                  Start Free Trial 🎁
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-10 py-7 text-lg font-bold border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 text-white transition-all hover:scale-105"
                >
                  Explore Features 🎯
                </Button>
              </Link>
            </div>
            
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                <span>No credit card 💳</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>14-day free trial 🎁</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />
                <span>Cancel anytime 🚪</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-1">
                🎯 Features
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Everything You Need
                </span>
                <br />
                <span className="text-white">to Dominate 🏆</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful tools designed to help you work smarter, not harder. 
                Let the magic happen! ✨
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  icon: CalendarDays, 
                  title: "Content Calendar 📅", 
                  desc: "Schedule posts across all platforms with our intuitive calendar view. Plan ahead like a pro!",
                  color: "from-pink-400 to-rose-500",
                  glow: "group-hover:shadow-pink-500/20"
                },
                { 
                  icon: BarChart3, 
                  title: "Analytics 📊", 
                  desc: "Track engagement, followers, and performance across all accounts. Data-driven decisions!",
                  color: "from-cyan-400 to-blue-500",
                  glow: "group-hover:shadow-cyan-500/20"
                },
                { 
                  icon: Share2, 
                  title: "Cross-Posting 🔄", 
                  desc: "Post to multiple platforms simultaneously with customized content. One click, everywhere!",
                  color: "from-fuchsia-400 to-purple-500",
                  glow: "group-hover:shadow-purple-500/20"
                },
                { 
                  icon: Zap, 
                  title: "AI-Powered 🤖", 
                  desc: "Smart suggestions for optimal posting times and content ideas. Your personal AI assistant!",
                  color: "from-yellow-400 to-orange-500",
                  glow: "group-hover:shadow-yellow-500/20"
                },
                { 
                  icon: Shield, 
                  title: "Team Collaboration 🤝", 
                  desc: "Work together with your team with roles and approval workflows. Better together!",
                  color: "from-lime-400 to-green-500",
                  glow: "group-hover:shadow-lime-500/20"
                },
                { 
                  icon: Globe, 
                  title: "Multi-Platform 🌐", 
                  desc: "Connect Twitter, Instagram, LinkedIn, and TikTok accounts. All in one place!",
                  color: "from-violet-400 to-indigo-500",
                  glow: "group-hover:shadow-violet-500/20"
                },
              ].map((feature, i) => (
                <Card 
                  key={i} 
                  className={`group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:${feature.glow}`}
                >
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <CardHeader className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-gray-400 text-base leading-relaxed">
                      {feature.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-pink-500/20 text-pink-300 border-pink-500/30 px-4 py-1">
                💎 Pricing
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
                <span className="text-white">Simple, </span>
                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                  Transparent
                </span>
                <span className="text-white"> Pricing 💰</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Choose the plan that works best for you. No hidden fees, no surprises! 🎪
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <Card className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-500 hover:scale-105">
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white">Starter 🌱</CardTitle>
                  <CardDescription className="text-gray-400">For individuals</CardDescription>
                  <div className="text-4xl font-black mt-4 text-white">$9<span className="text-lg font-normal text-gray-400">/month</span></div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-lime-400" /> Up to 3 accounts</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-lime-400" /> 50 posts/month</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-lime-400" /> Basic analytics</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-lime-400" /> Email support</li>
                  </ul>
                  <Link href="/register">
                    <Button className="w-full mt-6 border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all" variant="outline">
                      Get Started 🚀
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Plan - Featured */}
              <Card className="group relative overflow-hidden transition-all duration-500 hover:scale-105 border-fuchsia-500/50">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-cyan-600/20" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" />
                
                {/* Popular badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white border-0">
                    Most Popular ⭐
                  </Badge>
                </div>

                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white">Pro 🚀</CardTitle>
                  <CardDescription className="text-gray-400">For growing businesses</CardDescription>
                  <div className="text-4xl font-black mt-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">$29<span className="text-lg font-normal text-gray-400">/month</span></div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-fuchsia-400" /> Up to 10 accounts</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-fuchsia-400" /> Unlimited posts</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-fuchsia-400" /> Advanced analytics</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-fuchsia-400" /> Priority support</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-fuchsia-400" /> Team collaboration</li>
                  </ul>
                  <Link href="/register">
                    <Button className="w-full mt-6 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all">
                      Get Started 🎉
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-500 hover:scale-105">
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white">Enterprise 🏢</CardTitle>
                  <CardDescription className="text-gray-400">For large teams</CardDescription>
                  <div className="text-4xl font-black mt-4 text-white">$99<span className="text-lg font-normal text-gray-400">/month</span></div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-cyan-400" /> Unlimited accounts</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-cyan-400" /> Unlimited posts</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-cyan-400" /> Custom analytics</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-cyan-400" /> Dedicated support</li>
                    <li className="flex items-center text-gray-300"><CheckCircle2 className="h-5 w-5 mr-3 text-cyan-400" /> API access</li>
                  </ul>
                  <Button className="w-full mt-6 border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all" variant="outline">
                    Contact Sales 📞
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-4 py-1">
                💕 Testimonials
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
                <span className="text-white">Loved by </span>
                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                  Thousands
                </span>
                <span className="text-white"> 🌟</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                See what our customers have to say about their experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "This platform has completely transformed how our team collaborates. We've seen a 40% increase in productivity since switching. 🚀",
                  name: "Sarah Chen",
                  role: "Product Manager at TechCorp",
                  initials: "SC",
                  color: "from-pink-500 to-rose-500"
                },
                {
                  quote: "The AI features are incredible. It's like having an extra team member who never sleeps and always knows exactly what you need. 🤖✨",
                  name: "Marcus Johnson",
                  role: "CTO at StartupXYZ",
                  initials: "MJ",
                  color: "from-cyan-500 to-blue-500"
                },
                {
                  quote: "Best investment we've made this year. The ROI was visible within the first month. Cannot recommend it enough! 💯",
                  name: "Emily Rodriguez",
                  role: "Founder at DesignStudio",
                  initials: "ER",
                  color: "from-lime-500 to-green-500"
                }
              ].map((testimonial, i) => (
                <Card 
                  key={i} 
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-500 hover:scale-105"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${testimonial.color}`} />
                  <CardContent className="pt-8">
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-pulse" style={{ animationDelay: `${j * 0.1}s` }} />
                      ))}
                    </div>
                    <p className="text-white mb-8 text-lg leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 ring-2 ring-white/20 group-hover:ring-white/50 transition-all">
                        <AvatarFallback className={`bg-gradient-to-br ${testimonial.color} text-white font-bold`}>
                          {testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white text-lg">{testimonial.name}</p>
                        <p className="text-gray-400 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden border-0">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-cyan-600 animate-gradient-slow" />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }} />
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-4 right-4 text-6xl animate-bounce-slow">🎉</div>
              <div className="absolute bottom-4 left-4 text-5xl animate-pulse">✨</div>
              <div className="absolute top-1/2 right-10 text-4xl animate-float">🚀</div>
              
              <CardContent className="relative z-10 p-12 sm:p-16 text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
                  Ready to get started? 🚀
                </h2>
                <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                  Join thousands of teams already using SocialFlow to build better social presence, faster.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button 
                      size="lg" 
                      className="px-10 py-7 text-lg font-bold bg-white text-purple-600 hover:bg-gray-100 hover:scale-105 transition-all shadow-xl"
                    >
                      Start Free Trial 🎁
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-10 py-7 text-lg font-bold border-2 border-white/50 text-white hover:bg-white/20 hover:border-white transition-all"
                  >
                    Contact Sales 📞
                  </Button>
                </div>
                <p className="mt-8 text-sm text-white/60">
                  Free 14-day trial • No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { title: "Product 🛠️", links: ["Features", "Pricing", "Integrations", "Changelog"] },
              { title: "Company 🏢", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Resources 📚", links: ["Documentation", "Help Center", "Community", "Contact"] },
              { title: "Legal ⚖️", links: ["Privacy", "Terms", "Security", "Cookies"] },
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-white">{section.title}</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SocialFlow ✨
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 SocialFlow. All rights reserved. Made with 💜
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
