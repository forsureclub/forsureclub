
import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "./ui/use-toast"

export const SubscriptionPlans = () => {
  const [loading, setLoading] = useState("")
  const { toast } = useToast()

  const plans = [
    {
      name: "Basic",
      price: "$29/month",
      features: ["Match with 5 players/month", "Basic player stats", "Email notifications"],
      tier: "basic"
    },
    {
      name: "Premium",
      price: "$49/month",
      features: ["Match with unlimited players", "Detailed performance analytics", "Priority matching"],
      tier: "premium"
    },
    {
      name: "Enterprise",
      price: "$99/month",
      features: ["Custom match organization", "Dedicated support", "Course booking assistance"],
      tier: "enterprise"
    }
  ]

  const handleSubscribe = async (tier: string) => {
    try {
      setLoading(tier)
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier }
      })
      
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="mt-4 text-lg text-gray-600">
            Select the perfect plan for your sports matching needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.tier} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-3xl font-bold text-blue-600">{plan.price}</p>
                <ul className="mt-6 space-y-4 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg
                        className="h-6 w-6 text-green-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={!!loading}
                >
                  {loading === plan.tier ? "Processing..." : "Subscribe Now"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
