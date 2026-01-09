import { PolicyPurchase } from "@/components/purchase/policy-purchase"
import { Shield, Sparkles, Zap, CheckCircle2, FileText } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Purchase Insurance | HyperInsure",
  description: "Purchase insurance coverage for your blockchain transactions",
}

export default function PurchasePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Elegant Blue Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/12 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16 space-y-6">
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-foreground mb-2">Purchase</span>
              <span className="block text-gradient">Insurance Coverage</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Protect your Bitcoin transactions from delays and uncertainty
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Coverage Up To</div>
                  <div className="text-lg font-semibold text-foreground">1,000 STX</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Instant</div>
                  <div className="text-lg font-semibold text-foreground">Activation</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Starting At</div>
                  <div className="text-lg font-semibold text-foreground">2% Premium</div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Purchase Component */}
          <PolicyPurchase />

          {/* How It Works Section */}
          <div className="mt-24 mb-16 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gradient mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Simple Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">How It </span>
                <span className="text-gradient">Works</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Simple steps to protect your Bitcoin transactions
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
              
              {[
                {
                  step: "01",
                  title: "Select Plan",
                  description: "Choose your coverage plan based on your needs",
                  icon: Shield,
                  color: "primary",
                },
                {
                  step: "02",
                  title: "Enter Amount",
                  description: "Specify the STX amount you want to insure",
                  icon: FileText,
                  color: "accent",
                },
                {
                  step: "03",
                  title: "Pay Premium",
                  description: "Complete payment using your Stacks wallet",
                  icon: CheckCircle2,
                  color: "secondary",
                },
                {
                  step: "04",
                  title: "Get Protected",
                  description: "Your policy is active immediately",
                  icon: Zap,
                  color: "primary",
                },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="relative group">
                    <div className="glass rounded-3xl p-8 border border-white/10 hover:border-primary/30 text-center space-y-5 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 mb-4 transition-all group-hover:scale-110">
                          <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 group-hover:bg-primary/20 mb-2">
                          <span className="text-xs font-bold text-primary">{item.step}</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-gradient transition-colors mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Arrow connector */}
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 z-20">
                        <div className="w-6 h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-t-2 border-primary/50 rotate-45 -translate-x-1" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="relative">
            <div className="glass rounded-3xl p-12 border border-white/10 relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
              
              <div className="text-center mb-12 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gradient mb-6">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Key Benefits</span>
                </div>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-foreground">Why Choose </span>
                  <span className="text-gradient">HyperInsure?</span>
                </h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
                {[
                  {
                    value: "100%",
                    label: "On-Chain",
                    description: "All policies stored on Stacks blockchain",
                    icon: Shield,
                  },
                  {
                    value: "Instant",
                    label: "Activation",
                    description: "Coverage starts immediately",
                    icon: Zap,
                  },
                  {
                    value: "Trustless",
                    label: "Verification",
                    description: "Cryptographic proof verification",
                    icon: CheckCircle2,
                  },
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="group relative flex flex-col">
                      <div className="glass rounded-2xl p-8 border border-white/10 hover:border-primary/30 text-center flex flex-col flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
                        <div className="flex-shrink-0 mb-4">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
                            <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 mb-3">
                          <div className="text-4xl md:text-5xl font-bold text-gradient group-hover:scale-110 transition-transform h-[3.5rem] md:h-[4rem] flex items-center justify-center">
                            {item.value}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mb-3">
                          <div className="text-lg font-semibold text-foreground h-7 flex items-center justify-center">
                            {item.label}
                          </div>
                        </div>
                        <div className="flex-1 flex items-start justify-center pt-2">
                          <div className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
