import { TransactionVerification } from "@/components/claim/verification-component"
import { Search, CheckCircle2, Clock, Info, AlertCircle, Shield } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Verify Transaction | HyperInsure",
  description: "Verify transaction delays and check claim eligibility",
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Elegant Blue Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16 space-y-6">

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-foreground mb-2">Verify</span>
              <span className="block text-gradient">Transaction Status</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Check if your Bitcoin transaction delay qualifies for an insurance claim
            </p>

            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 group-hover:scale-110 transition-all">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">1. Enter Transaction</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Provide your Bitcoin transaction ID and broadcast height
                  </p>
                </div>
              </div>
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-accent/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 border border-accent/20 flex items-center justify-center mb-6 shadow-lg shadow-accent/10 group-hover:shadow-accent/20 group-hover:scale-110 transition-all">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-accent transition-colors">2. Analyze Delay</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    System calculates exact delay using blockchain data
                  </p>
                </div>
              </div>
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-secondary/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/15 to-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 shadow-lg shadow-secondary/10 group-hover:shadow-secondary/20 group-hover:scale-110 transition-all">
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-secondary transition-colors">3. Get Results</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    See if your transaction qualifies for a claim
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Component */}
          <TransactionVerification />

          {/* Help & Information Section */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="glass rounded-2xl p-6 border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">How Verification Works</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Fetch Transaction Data</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">We retrieve your transaction from Bitcoin blockchain APIs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Calculate Delay</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">Delay = Inclusion Height - Broadcast Height (in blocks)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Check Eligibility</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">Compare delay against your policy's threshold requirement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 border border-accent/20">
                    <AlertCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Important Notes</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4 text-accent" />
                      Broadcast Height
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The block height when you submitted the transaction. If unknown, we estimate based on fee rate.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      Inclusion Height
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The block height where your transaction was confirmed. Fetched automatically from blockchain.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      Delay Threshold
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Each policy has a minimum delay threshold (typically 35+ blocks). Your transaction must exceed this to qualify.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <Shield className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        This is a verification tool. To submit a claim, visit the <Link href="/claim" className="text-primary hover:underline font-medium">Claims page</Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
