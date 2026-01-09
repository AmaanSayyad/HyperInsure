import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="w-full py-32 px-6 relative overflow-hidden">
      {/* Dramatic Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full mesh-gradient opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-primary/20 rounded-2xl rotate-12 animate-float" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border border-accent/20 rounded-2xl -rotate-12 animate-float delay-150" />

      <div className="max-w-5xl mx-auto relative">
        {/* Glass Card Container */}
        <div className="glass rounded-[3rem] p-12 md:p-16 border border-white/10 relative overflow-hidden">
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 -z-10" />
          
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gradient">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Join 1,200+ Protected Users</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-foreground mb-2">Ready to Protect</span>
                <span className="block text-gradient">Your Transactions?</span>
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join thousands of users protecting their Bitcoin transactions with trustless, 
                on-chain insurance. Get coverage in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/purchase">
                <Button 
                  size="lg"
                  className="group px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold text-lg shadow-2xl shadow-primary/50 transition-all hover:scale-105"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="#features-section">
                <Button 
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 glass hover:bg-white/5 rounded-full font-semibold text-lg border-white/10 transition-all hover:scale-105"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12 border-t border-white/5">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">$2M+</div>
                <div className="text-sm text-muted-foreground">Total Protected</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">1,200+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
