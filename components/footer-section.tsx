"use client"

import { Twitter, Github, Linkedin } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-[70px]">
      {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
        <div className="flex gap-3 items-stretch justify-center">
          <div className="text-center text-foreground text-xl font-semibold leading-4">⚡ HyperInsure</div>
        </div>
        <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">Decentralized insurance for blockchain transactions</p>
        <div className="flex justify-start items-start gap-3">
          <a href="#" aria-label="Twitter" className="w-4 h-4 flex items-center justify-center">
            <Twitter className="w-full h-full text-muted-foreground" />
          </a>
          <a href="#" aria-label="GitHub" className="w-4 h-4 flex items-center justify-center">
            <Github className="w-full h-full text-muted-foreground" />
          </a>
          <a href="#" aria-label="LinkedIn" className="w-4 h-4 flex items-center justify-center">
            <Linkedin className="w-full h-full text-muted-foreground" />
          </a>
        </div>
      </div>
      {/* Right Section: Insurance, Company, Resources */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Insurance</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <a href="/policies" className="text-foreground text-sm font-normal leading-5 hover:underline">
              View Policies
            </a>
            <a href="/purchase" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Buy Insurance
            </a>
            <a href="/claim" className="text-foreground text-sm font-normal leading-5 hover:underline">
              File Claim
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Coverage Types
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Company</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              About us
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Our team
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Careers
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Contact
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">Resources</h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Terms of Service
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Documentation
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Help Center
            </a>
            <a href="#" className="text-foreground text-sm font-normal leading-5 hover:underline">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}