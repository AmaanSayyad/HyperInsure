"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, HelpCircle, Mail } from "lucide-react"

const faqData = [
  {
    question: "What is HyperInsure and who is it for?",
    answer:
      "HyperInsure is the first on-chain insurance protocol protecting Bitcoin users from transaction delays, mempool congestion, and finality issues. It's for anyone sending Bitcoin transactions who wants protection against delays that can cause inconvenience and financial loss.",
  },
  {
    question: "What problems does HyperInsure solve?",
    answer:
      "HyperInsure addresses critical Bitcoin transaction issues: transactions stuck in mempools during high congestion, uncertainty in block inclusion timing, delays measured in Bitcoin blocks, and financial losses from delayed transaction finality. Our block-based delay protection ensures users are compensated when delays exceed policy thresholds.",
  },
  {
    question: "How does HyperInsure work?",
    answer:
      "Users purchase insurance coverage using STX tokens by selecting a policy (Starter, Professional, or Enterprise) and paying a premium. When a Bitcoin transaction experiences delays, users submit claim details including transaction ID, merkle proofs, and block headers. Clarity smart contracts verify the Bitcoin transaction using cryptographic proofs and calculate delay using Bitcoin burn block heights. If the delay exceeds the policy threshold, automated payouts are released from the STX treasury.",
  },
  {
    question: "What makes HyperInsure trustless?",
    answer:
      "HyperInsure requires no trust in centralized parties. All insurance logic is executed on-chain using Clarity smart contracts, with cryptographic proofs verified automatically. Payouts are instant and non-custodial.",
  },
  {
    question: "What technology powers HyperInsure?",
    answer:
      "HyperInsure is built on Stacks blockchain with Clarity smart contracts for deterministic, auditable insurance logic; Bitcoin burn block heights for objective time measurement; Bitcoin transaction verification using merkle proofs and block headers; and STX reserves in a decentralized treasury for instant payouts. All verification happens on-chain without requiring trust in centralized parties.",
  },
  {
    question: "What future products will HyperInsure offer?",
    answer:
      "We plan to extend to many types of blockchain insurance, including wallet theft protection, transaction failure coverage, gas-spike hedging, validator risk coverage, and cross-chain finality protection.",
  },
]

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div
      onClick={onToggle}
      className={`group relative glass rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isOpen 
          ? "border-primary/30 bg-white/5 shadow-lg shadow-primary/10" 
          : "border-white/10 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      {/* Gradient overlay when open */}
      {isOpen && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}
      
      <div className="relative p-6 flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold leading-snug transition-colors ${
            isOpen 
              ? "text-gradient" 
              : "text-foreground group-hover:text-gradient"
          }`}>
            {question}
          </h3>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isOpen 
            ? "bg-primary/20 text-primary rotate-180" 
            : "bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-foreground"
        }`}>
          <ChevronDown className="w-5 h-5 transition-transform duration-300" />
        </div>
      </div>
      
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-0">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
          <p className="text-muted-foreground leading-relaxed text-base">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]))
  
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section className="w-full py-24 px-6 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-primary/20 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">FAQ</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="text-foreground">Frequently Asked </span>
            <span className="text-gradient">Questions</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about HyperInsure
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqData.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <div className="mt-20 relative">
          <div className="glass rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            
            <div className="relative z-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Still have questions?
              </h3>
              
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              
              <a
                href="mailto:support@hyperinsure.io"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-base transition-all hover:scale-105 shadow-lg shadow-primary/30"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
