"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Zap, Lock, ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[600px] md:min-h-[700px] lg:min-h-[850px] flex flex-col items-center overflow-visible pt-0 px-4">
      {/* Elegant Blue Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blue gradient orbs - single color tone */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-primary/25 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[110px] opacity-50" />
        <div className="absolute bottom-0 left-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[130px] opacity-40" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-32 md:pt-40 lg:pt-48 space-y-8 max-w-5xl mx-auto text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full glass border-gradient">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-foreground/90">
            Secured by
          </span>
          <img 
            src="/bitcoin-btc-logo.png" 
            alt="Bitcoin" 
            className="w-5 h-5 object-contain"
          />
          <span className="text-sm font-medium text-foreground/90">
            Bitcoin • Built on
          </span>
          <img 
            src="/stacks-stx-logo.png" 
            alt="Stacks" 
            className="w-5 h-5 object-contain"
          />
          <span className="text-sm font-medium text-foreground/90">
            Stacks
          </span>
        </div>

        {/* Main Heading */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
            <span className="block text-foreground mb-3">Protect Your</span>
            <span className="block text-gradient drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Bitcoin Transactions
            </span>
        </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            First trustless insurance protocol for transaction delays. 
            Get instant coverage with cryptographic proofs.
        </p>
      </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full glass">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Trustless</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full glass">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground/80">Instant Payouts</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full glass">
            <Lock className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground/80">100% On-Chain</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
          <Link href="/purchase">
            <Button 
              size="lg" 
              className="group relative px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_70px_rgba(59,130,246,0.4)]"
            >
              Get Coverage Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Link href="#features-section">
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-7 glass hover:bg-white/5 rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02]"
            >
              How It Works
        </Button>
      </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-12 md:gap-20 pt-20 w-full max-w-3xl">
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-gradient">$5M+</div>
            <div className="text-sm text-muted-foreground">Total Insured</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-gradient">24/7</div>
            <div className="text-sm text-muted-foreground">Protection</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-gradient">100%</div>
            <div className="text-sm text-muted-foreground">Decentralized</div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/3 left-10 w-24 h-24 border border-primary/15 rounded-2xl rotate-12 animate-float opacity-30" />
      <div className="absolute bottom-1/3 right-10 w-20 h-20 border border-primary/15 rounded-2xl -rotate-12 animate-float opacity-30" style={{ animationDelay: '1s' }} />
    </section>
  )
}
