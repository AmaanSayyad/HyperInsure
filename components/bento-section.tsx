import Image from "next/image"
import { Shield, Send, CheckCircle2, Calculator, Wallet, Building2 } from "lucide-react"

const icons = [
  Shield,
  Send,
  CheckCircle2,
  Calculator,
  Wallet,
  Building2,
]

const BentoCard = ({ 
  title, 
  description, 
  Component, 
  index 
}: { 
  title: string
  description: string
  Component: React.ComponentType
  index: number
}) => {
  const Icon = icons[index] || Shield
  
  return (
    <div 
      className="group overflow-hidden rounded-3xl border border-white/10 flex flex-col justify-start items-start relative transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Enhanced background with blur effect */}
      <div
        className="absolute inset-0 rounded-3xl transition-all duration-500"
        style={{
          background: "rgba(231, 236, 235, 0.06)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-transparent transition-all duration-500" />
      
      {/* Hover glow effect with animation */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="self-stretch p-6 md:p-7 flex flex-col justify-start items-start gap-3 relative z-10">
        {/* Icon and number badge */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-2.5 rounded-xl bg-card/50 border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
        
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <h3 className="self-stretch text-foreground text-xl font-bold leading-7 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="self-stretch text-muted-foreground text-sm leading-6 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            {description}
          </p>
        </div>
      </div>
      
      {/* Enhanced image container */}
      <div className="self-stretch h-80 md:h-72 lg:h-80 relative z-10 overflow-hidden">
        <div className="absolute inset-0 p-5 md:p-6 flex items-center justify-center">
          {/* Image wrapper with enhanced styling */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-transparent via-card/30 to-card/50 border border-white/5 group-hover:border-primary/20 transition-all duration-500">
            {/* Multi-layer gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-card/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Subtle shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20 pointer-events-none" />
            
            <Component />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BentoSection() {
  const cards = [
    {
      title: "Purchase Coverage with STX",
      description: "Users purchase insurance coverage using Stacks (STX) tokens for transaction delay protection.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/purchase.png"
            alt="Purchase Coverage with STX"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
    {
      title: "Submit Bitcoin Transaction",
      description: "Users submit Bitcoin transaction details (txid, merkle proofs) when experiencing delays.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/submit.png"
            alt="Submit Bitcoin Transaction"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
    {
      title: "Bitcoin Verification",
      description: "Clarity smart contracts verify Bitcoin transactions using merkle proofs and block headers.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/verify.png"
            alt="Bitcoin Verification"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
    {
      title: "Delay Calculation",
      description: "System calculates delay using Bitcoin burn block heights for objective time measurement.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/delay.png"
            alt="Delay Calculation"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
    {
      title: "Automated Payouts",
      description: "Smart contracts automatically release payouts when verified delay exceeds policy threshold.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/payout.png"
            alt="Automated Payouts"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
    {
      title: "Treasury Management",
      description: "Decentralized treasury pools premiums and maintains reserves for instant claim settlements.",
      Component: () => (
        <div className="w-full h-full relative">
          <Image
            src="/images/treasury.png"
            alt="Treasury Management"
            fill
            className="object-contain scale-100 group-hover:scale-[1.08] transition-transform duration-700 ease-out"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={95}
          />
          {/* Subtle image glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        </div>
      ),
    },
  ]

  return (
    <section className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent relative">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[100px] opacity-50" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
      </div>
      
      <div className="w-full py-12 md:py-20 relative flex flex-col justify-start items-start gap-8 z-10">
        {/* Enhanced header */}
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-4 z-10">
          <div className="flex flex-col justify-start items-center gap-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                Process Flow
              </span>
            </div>
            
            <h2 className="w-full max-w-[700px] text-center text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight md:leading-[66px]">
              <span className="block">⚡ How HyperInsure</span>
              <span className="block text-gradient">Works</span>
            </h2>
            <p className="w-full max-w-[650px] text-center text-muted-foreground text-base md:text-lg lg:text-xl font-medium leading-relaxed opacity-90">
              Protecting blockchain users from transaction latency, mempool congestion and finality delays with on-chain insurance
            </p>
          </div>
        </div>
        
        {/* Enhanced grid with staggered animations */}
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 lg:gap-8 z-10">
          {cards.map((card, index) => (
            <BentoCard key={card.title} {...card} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
