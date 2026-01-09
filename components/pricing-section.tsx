"use client"

import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Starter",
      icon: Zap,
      delayThreshold: "35 blocks",
      premiumRate: "2%",
      protocolFee: "1%",
      payoutPerIncident: "500 STX",
      description: "Perfect for casual transactions",
      features: [
        "35 block delay threshold",
        "2% premium rate",
        "Standard support",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      icon: Sparkles,
      delayThreshold: "30 blocks",
      premiumRate: "3%",
      protocolFee: "1.5%",
      payoutPerIncident: "1,000 STX",
      description: "For active traders",
      features: [
        "30 block delay threshold",
        "3% premium rate",
        "Priority support",
        "Advanced analytics",
      ],
      buttonText: "Go Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      icon: Crown,
      delayThreshold: "40 blocks",
      premiumRate: "2.5%",
      protocolFee: "1.2%",
      payoutPerIncident: "750 STX",
      description: "Maximum protection",
      features: [
        "40 block delay threshold",
        "2.5% premium rate",
        "24/7 premium support",
        "Custom SLAs",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <section className="w-full px-6 py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Choose Your </span>
            <span className="text-gradient">Coverage Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the protection level that fits your transaction needs
          </p>
        </div>

        {/* Coverage Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 ${
                  plan.popular
                    ? "bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/50 shadow-2xl shadow-primary/20 scale-105"
                    : "glass border border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      plan.popular 
                        ? "bg-primary/20" 
                        : "bg-white/5"
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        plan.popular ? "text-primary" : "text-foreground"
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gradient">
                        {plan.premiumRate}
                      </span>
                      <span className="text-muted-foreground text-sm">premium rate</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delay Threshold:</span>
                        <span className="font-semibold text-foreground">{plan.delayThreshold}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Protocol Fee:</span>
                        <span className="font-semibold text-foreground">{plan.protocolFee}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href="/purchase">
                    <Button
                      className={`w-full rounded-xl py-6 font-semibold text-base ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                          : "glass hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>

                  {/* Features */}
                  <div className="space-y-3 pt-4">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className={`mt-1 p-1 rounded-full ${
                          plan.popular ? "bg-primary/20" : "bg-white/5"
                        }`}>
                          <Check className={`w-3 h-3 ${
                            plan.popular ? "text-primary" : "text-foreground"
                          }`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
