"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Zap, Shield, Sparkles, Star, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

function FloatingShape({ 
  className, 
  delay = 0 
}: { 
  className: string; 
  delay?: number;
}) {
  return (
    <div 
      className={`absolute rounded-full blur-3xl opacity-60 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

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

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
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
            <span className="block mb-2">Build faster with</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              funky magic ✨
            </span>
          </h1>
          
          <p className={`text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Empower your team with cutting-edge solutions that streamline workflows, 
            boost productivity, and drive innovation forward. 🚀
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button 
              size="lg" 
              className="px-10 py-7 text-lg font-bold group bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-10 py-7 text-lg font-bold border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 text-white transition-all hover:scale-105"
            >
              View Demo 🎬
            </Button>
          </div>
          
          <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              <span>No credit card 💳</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>14-day free trial 🎁</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />
              <span>Cancel anytime 🚪</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-1">
              🎯 Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Everything you need
              </span>
              <br />
              <span className="text-white">to succeed 🏆</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help you work smarter, not harder.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: "/images/icon-lightning.jpg", 
                title: "Lightning Fast ⚡", 
                desc: "Optimized for speed with sub-second response times and instant updates across all devices.",
                color: "from-yellow-400 to-orange-500"
              },
              { 
                icon: "/images/icon-shield.jpg", 
                title: "Fortress Security 🛡️", 
                desc: "Bank-grade encryption and compliance with SOC 2, GDPR, and HIPAA standards.",
                color: "from-cyan-400 to-blue-500"
              },
              { 
                icon: "/images/icon-ai.jpg", 
                title: "AI-Powered 🤖", 
                desc: "Built-in artificial intelligence that learns your workflow and suggests optimizations.",
                color: "from-fuchsia-400 to-purple-500"
              },
              { 
                icon: "/images/icon-star.jpg", 
                title: "Premium Support ⭐", 
                desc: "24/7 dedicated support team with average response time under 5 minutes.",
                color: "from-lime-400 to-green-500"
              },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardHeader className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-purple-500/20">
                    <img 
                      src={feature.icon} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
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

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-pink-500/20 text-pink-300 border-pink-500/30 px-4 py-1">
              💕 Testimonials
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              <span className="text-white">Loved by </span>
              <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                thousands
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
                quote: "This platform has completely transformed how our team collaborates. We have seen a 40% increase in productivity since switching. 🚀",
                name: "Sarah Chen",
                role: "Product Manager at TechCorp",
                avatar: "/images/avatar-1.jpg",
                initials: "SC",
                color: "from-pink-500 to-rose-500"
              },
              {
                quote: "The AI features are incredible. It is like having an extra team member who never sleeps and always knows exactly what you need. 🤖✨",
                name: "Marcus Johnson",
                role: "CTO at StartupXYZ",
                avatar: "/images/avatar-2.jpg",
                initials: "MJ",
                color: "from-cyan-500 to-blue-500"
              },
              {
                quote: "Best investment we have made this year. The ROI was visible within the first month. Cannot recommend it enough! 💯",
                name: "Emily Rodriguez",
                role: "Founder at DesignStudio",
                avatar: "/images/avatar-3.jpg",
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
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 ring-2 ring-white/20 group-hover:ring-white/50 transition-all">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
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
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
            
            {/* Floating elements */}
            <div className="absolute top-4 right-4 text-6xl animate-bounce-slow">🎉</div>
            <div className="absolute bottom-4 left-4 text-5xl animate-pulse">✨</div>
            <div className="absolute top-1/2 right-10 text-4xl animate-float">🚀</div>
            
            <CardContent className="relative z-10 p-12 sm:p-16 text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-white">
                Ready to get started? 🚀
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                Join thousands of teams already using our platform to build better products, faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="px-10 py-7 text-lg font-bold bg-white text-purple-600 hover:bg-gray-100 hover:scale-105 transition-all shadow-xl"
                >
                  Start Free Trial 🎁
                </Button>
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
                Acme Inc ✨
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 Acme Inc. All rights reserved. Made with 💜
            </p>
          </div>
        </div>
      </footer>

      {/* Global Styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-slow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 8s ease infinite;
        }
      `}</style>
    </main>
  );
}
