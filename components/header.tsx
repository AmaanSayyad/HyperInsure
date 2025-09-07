"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link" // Import Link for client-side navigation
import StacksWalletConnect from "./stackswalletcontext"

export function Header() {
  const landingNavItems = [
    { name: "How It Works", href: "#features-section" },
    { name: "Insurance Plans", href: "#pricing-section" },
    { name: "Testimonials", href: "#testimonials-section" },
    { name: "FAQ", href: "#faq-section" },
  ]
  
  const appNavItems = [
    { name: "Policies", href: "/policies" },
    { name: "Purchase", href: "/purchase" },
    { name: "Claim", href: "/claim" },
    { name: "Admin", href: "/admin" },
  ]
  
  // Determine if we're on the landing page or app pages
  const isLandingPage = typeof window !== "undefined" && window.location.pathname === "/"
  const navItems = isLandingPage ? landingNavItems : appNavItems

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only apply smooth scrolling to landing page section links (starting with #)
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1) // Remove '#' from href
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <header className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-foreground text-xl font-semibold hover:text-primary transition-colors">
              ⚡HyperInsure
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                className="text-[#888888] hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/purchase" className="hidden md:block">
          <StacksWalletConnect
              variant="default"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
              showAddress={true}
            />
          
          </Link>
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border text-foreground">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                    className="text-[#888888] hover:text-foreground justify-start text-lg py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link href="/purchase" className="w-full mt-4">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm">
                    Get Coverage
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
