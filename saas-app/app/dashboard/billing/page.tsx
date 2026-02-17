"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

interface Subscription {
  id: string
  plan: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
}

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchSubscription = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/subscriptions/current`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setSubscription(data.subscription)
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [router])

  const handleSubscribe = async (planId: string) => {
    const token = localStorage.getItem("token")
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/subscriptions/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: `price_${planId}`,
          plan: planId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleManageBilling = async () => {
    const token = localStorage.getItem("token")
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/subscriptions/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 9,
      features: [
        "Up to 3 social accounts",
        "50 posts per month",
        "Basic analytics",
        "Email support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      features: [
        "Up to 10 social accounts",
        "Unlimited posts",
        "Advanced analytics",
        "Priority support",
        "Team collaboration",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      features: [
        "Unlimited social accounts",
        "Unlimited posts",
        "Custom analytics",
        "Dedicated support",
        "API access",
      ],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {subscription?.plan && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your plan</CardDescription>
              </div>
              <Badge>{subscription.plan}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {subscription.status}</p>
              <p><strong>Renews on:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-amber-600">Cancels at period end</p>
              )}
            </div>
            <Button onClick={handleManageBilling} className="mt-4">
              Manage Billing
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="credits">Buy Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={subscription?.plan === plan.id ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {subscription?.plan === plan.id ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      Subscribe
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Buy Credits</CardTitle>
              <CardDescription>
                Purchase credits for additional features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Credit purchase functionality coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
