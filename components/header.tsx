"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Network, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Box, Copy, Check } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectWalletButton } from "@/lib/stacks-provider"
import { APP_CONFIG, CONTRACT_ADDRESSES, DEPLOYER_ADDRESS, validateConfig } from '@/lib/stacks-config'

const CONTRACT_LABELS: Record<string, string> = {
  'CLARITY_BITCOIN': 'Clarity Bitcoin',
  'INSURANCE_TREASURY': 'Insurance Treasury',
  'POLICY_MANAGER': 'Policy Manager',
  'CLAIM_PROCESSOR': 'Claim Processor',
  'HYPERINSURE_CORE_V2': 'HyperInsure Core V2',
  'FRONTEND_API': 'Frontend API',
  'GOVERNANCE': 'Governance',
  'ORACLE': 'Oracle',
  'HYPERINSURE_CORE': 'HyperInsure Core',
}

export function Header() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  const landingNavItems = [
    { name: "Features", href: "#features-section", description: undefined },
    { name: "Coverage Plans", href: "#coverage-section", description: undefined },
    { name: "Testimonials", href: "#testimonials-section", description: undefined },
    { name: "FAQ", href: "#faq-section", description: undefined },
  ]
  
  const appNavItems = [
    { name: "Policies", href: "/policies", description: "View your coverage" },
    { name: "Purchase", href: "/purchase", description: "Get insurance" },
    { name: "Verify", href: "/verify", description: "Check transaction" },
    { name: "Claim", href: "/claim", description: "Submit claim" },
    { name: "Admin", href: "/admin", description: "Admin panel" },
  ]
  
  const pathname = usePathname()
  const isLandingPage = pathname === "/"
  const navItems = isLandingPage ? landingNavItems : appNavItems

  const contractEntries = Object.entries(CONTRACT_ADDRESSES).filter(([_, address]) => address)
  const deployerAddress = DEPLOYER_ADDRESS

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(id)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <header className="w-full sticky top-0 z-50 glass border-b border-white/5">
      {/* Top Info Bar - Network Status */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left - Network Status */}
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <Badge className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs">
                  {APP_CONFIG.NETWORK.toUpperCase()}
                </Badge>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs text-foreground font-medium">
                  All contracts deployed
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full h-7"
              >
                <Box className="w-3.5 h-3.5 mr-1.5" />
                {contractEntries.length} contracts
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-1" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                )}
              </Button>
            </div>

            {/* Right - Deployer Address */}
            {deployerAddress && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/5">
                <span className="text-xs text-muted-foreground">Deployer:</span>
                <button
                  onClick={() => copyToClipboard(deployerAddress, 'deployer')}
                  className="text-xs font-mono text-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  {formatAddress(deployerAddress)}
                  {copiedAddress === 'deployer' ? (
                    <Check className="w-3 h-3 text-secondary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-3xl group-hover:scale-110 transition-all duration-300">⚡</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground group-hover:text-gradient transition-all">
                HyperInsure
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                Bitcoin Protection
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              return (
              <Link
                key={item.name}
                href={item.href}
                  onClick={(e) => handleScroll(e, item.href)}
                  className={`relative px-4 py-2 rounded-full font-medium transition-all text-sm ${
                    isActive
                      ? "text-foreground bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  title={item.description}
              >
                {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
              </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="glass rounded-full text-xs border-white/10 hover:bg-white/5"
            >
              <a
                href={APP_CONFIG.EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
            
            <Link href="/purchase">
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
              Get Coverage
            </Button>
          </Link>
            <ConnectWalletButton className="text-sm" />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground rounded-full">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass border-l border-white/10 w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-bold text-gradient">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                  return (
                  <Link
                    key={item.name}
                    href={item.href}
                      onClick={(e) => handleScroll(e, item.href)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? "text-foreground bg-white/10 border border-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
                        )}
                      </div>
                  </Link>
                  )
                })}
                <div className="pt-4 space-y-2">
                  <Link href="/purchase" className="w-full block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold">
                    Get Coverage
                  </Button>
                </Link>
                  <ConnectWalletButton className="w-full" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Expanded Contract Panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 glass border-b border-white/5 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Contract Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contractEntries.map(([name, address]) => {
                const contractName = address.split('.')[1]
                const displayName = CONTRACT_LABELS[name] || name.replace(/_/g, ' ')
                
                return (
                  <div
                    key={name}
                    className="group relative glass rounded-xl p-4 hover:bg-white/5 transition-all border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Box className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {displayName}
                            </div>
                            <div className="text-xs text-foreground/60 font-mono truncate">
                              {contractName}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(address, name)}
                          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === name ? (
                            <Check className="w-3.5 h-3.5 text-secondary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        
                        <a
                          href={`https://explorer.hiro.so/txid/${address}?chain=testnet&tab=overview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                          title="View in explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
