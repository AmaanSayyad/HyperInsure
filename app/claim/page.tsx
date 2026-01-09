import { ClaimForm } from "@/components/claim/claim-form"
import { FileCheck, Shield, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react"

export const metadata = {
  title: "Submit Claim | HyperInsure",
  description: "Submit insurance claims for delayed Bitcoin transactions",
}

export default function ClaimPage() {
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
              <span className="block text-foreground mb-2">Submit a</span>
              <span className="block text-gradient">Transaction Claim</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              File a claim for delayed Bitcoin transactions and receive your payout instantly
            </p>

            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-accent/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 border border-accent/20 flex items-center justify-center mb-6 shadow-lg shadow-accent/10 group-hover:shadow-accent/20 group-hover:scale-110 transition-all">
                    <Shield className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-accent transition-colors">1. Select Purchase</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose the policy purchase you want to claim for
                  </p>
                </div>
              </div>
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 group-hover:scale-110 transition-all">
                    <FileCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">2. Verify Transaction</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Provide Bitcoin transaction details and verify delay
                  </p>
                </div>
              </div>
              <div className="glass rounded-2xl p-8 border border-white/10 hover:border-secondary/30 transition-all relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/15 to-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 shadow-lg shadow-secondary/10 group-hover:shadow-secondary/20 group-hover:scale-110 transition-all">
                    <Clock className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-secondary transition-colors">3. Get Payout</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Receive instant verification & automatic payment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Claim Form Component */}
          <ClaimForm />

          {/* Help & Information Section */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="glass rounded-2xl p-6 border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Claim Requirements</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Active Policy Purchase</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">You must have an active policy purchase (not expired)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Transaction Delay</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">Bitcoin transaction must be delayed beyond your policy's threshold</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-semibold text-foreground mb-1">Valid Proof</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">Transaction must be confirmed on Bitcoin blockchain with valid merkle proof</p>
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
                      <Clock className="w-4 h-4 text-accent" />
                      Delay Calculation
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Delay is calculated as the difference between inclusion height and broadcast height. The transaction must exceed your policy's delay threshold.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      Automatic Verification
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Claims are automatically verified on-chain using Bitcoin transaction proofs. Once verified, payouts are processed automatically.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      One Claim Per Purchase
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Each policy purchase can only have one claim. Make sure your transaction meets all requirements before submitting.
                    </p>
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
