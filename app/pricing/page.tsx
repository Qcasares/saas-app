"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individuals getting started",
    monthlyPrice: 9,
    yearlyPrice: 7,
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Up to 3 social accounts",
      "50 posts per month",
      "Basic analytics",
      "Email support",
      "1 team member",
      "30-day analytics history",
    ],
    notIncluded: [
      "Team collaboration",
      "Advanced analytics",
      "API access",
      "Custom integrations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses and creators",
    icon: Zap,
    color: "from-fuchsia-500 via-purple-500 to-cyan-500",
    popular: true,
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      "Up to 10 social accounts",
      "Unlimited posts",
      "Advanced analytics",
      "Priority support",
      "5 team members",
      "90-day analytics history",
      "Team collaboration",
      "Content calendar",
      "Media library",
    ],
    notIncluded: [
      "API access",
      "White-label options",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams and agencies",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      "Unlimited social accounts",
      "Unlimited posts",
      "Custom analytics",
      "Dedicated support",
      "Unlimited team members",
      "365-day analytics history",
      "API access",
      "White-label options",
      "Custom integrations",
      "SSO & advanced security",
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    if (!session) {
      window.location.href = `/login?callbackUrl=/pricing`;
      return;
    }

    setLoading(planId);
    try {
      // In production, this would create a Stripe checkout session
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          priceId: isYearly ? `${planId}_yearly` : `${planId}_monthly`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
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
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 flex items-center justify-center mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SocialFlow
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="text-white">Pricing</Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
            </nav>

            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-400 hover:text-white">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Simple, transparent pricing
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your social media management needs.
            No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm", !isYearly && "text-white", isYearly && "text-gray-400")}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={cn("text-sm", isYearly && "text-white", !isYearly && "text-gray-400")}>
              Yearly
            </span>
            <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
              Save 20%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative bg-white/5 border-white/10 overflow-hidden",
                  plan.popular && "border-fuchsia-500/50 scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" />
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">${price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600"
                        : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {loading === plan.id ? "Loading..." : "Get Started"}
                  </Button>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">What's included:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="w-5 h-5 text-lime-400 shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="w-5 h-5 flex items-center justify-center text-gray-600">—</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Can I change my plan later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "Is there a free trial?",
                a: "We offer a 14-day free trial on all plans. No credit card required to start.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel anytime. You'll continue to have access until the end of your billing period.",
              },
            ].map((faq, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-400">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Card className="bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-cyan-600/20 border-white/10">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">Still have questions?</h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                Our team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <Button className="bg-white text-black hover:bg-gray-100">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500">© 2024 SocialFlow. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-gray-500 hover:text-white">Terms</Link>
              <Link href="/contact" className="text-gray-500 hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
