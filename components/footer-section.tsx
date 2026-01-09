"use client"

import { Twitter, Github, Linkedin, Mail } from "lucide-react"
import Link from "next/link"

export function FooterSection() {
  return (
    <footer className="w-full border-t border-white/10 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-3xl group-hover:scale-110 transition-all duration-300">⚡</span>
              <span className="text-xl font-bold text-foreground group-hover:text-gradient transition-colors">HyperInsure</span>
            </Link>
            
            <p className="text-muted-foreground leading-relaxed max-w-sm text-base">
              The first on-chain insurance protocol protecting Bitcoin transactions from delays, 
              congestion, and finality issues.
            </p>

            {/* Enhanced Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com/hyperinsure"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl glass border border-white/10 hover:border-primary/30 hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://github.com/hyperinsure"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl glass border border-white/10 hover:border-primary/30 hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://linkedin.com/company/hyperinsure"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl glass border border-white/10 hover:border-primary/30 hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="mailto:hello@hyperinsure.io"
                className="w-11 h-11 rounded-xl glass border border-white/10 hover:border-primary/30 hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="Email"
              >
                <Mail className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Product</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/purchase" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Purchase Coverage
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/policies" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  My Policies
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/claim" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Submit Claim
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Verify Transaction
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Company</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  About Us
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Our Team
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Careers
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Blog
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Resources</h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Documentation
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  API Reference
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Help Center
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Privacy Policy
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground hover:text-gradient transition-all text-sm font-medium inline-block group">
                  Terms of Service
                  <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Enhanced Bottom Bar */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} HyperInsure. All rights reserved.
          </p>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full glass border border-white/10">
            <span className="text-sm text-muted-foreground font-medium">Powered by</span>
            <div className="flex items-center gap-2.5">
              <img 
                src="/stacks-stx-logo.png" 
                alt="Stacks" 
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-bold text-gradient">Stacks</span>
              <span className="text-sm text-muted-foreground">+</span>
              <img 
                src="/bitcoin-btc-logo.png" 
                alt="Bitcoin" 
                className="w-5 h-5 object-contain"
              />
              <span className="text-sm font-bold text-gradient">Bitcoin</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
