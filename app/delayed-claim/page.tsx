import { DelayedTransactionClaim } from "@/components/claim/delayed-transaction-claim"
import { Clock, FileCheck, AlertCircle } from "lucide-react"

export const metadata = {
  title: "Delayed Transaction Claim | HyperInsure",
  description: "Submit a claim for delayed blockchain transactions",
}

export default function DelayedClaimPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Elegant Blue Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Header */}

      {/* Content */}
      <div className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gradient mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Delayed Transaction Portal</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-foreground mb-2">Claim for</span>
              <span className="block text-gradient">Delayed Transactions</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Submit your claim for transactions that experienced unexpected delays
            </p>

            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">1. Identify Delay</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm your transaction delay qualifies
                </p>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">2. Provide Details</h3>
                <p className="text-sm text-muted-foreground">
                  Submit transaction information & proof
                </p>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">3. Receive Payout</h3>
                <p className="text-sm text-muted-foreground">
                  Get compensated for the delay instantly
                </p>
              </div>
            </div>
          </div>

          {/* Delayed Transaction Claim Component */}
          <DelayedTransactionClaim />
        </div>
      </div>
    </div>
  )
}
