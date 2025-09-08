"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle, Shield } from "lucide-react"

// Mock data for available policies
const availablePolicies = [
  {
    id: "POL-001",
    name: "Standard Transaction Delay Coverage",
    description: "Covers transactions delayed by more than 35 blocks with standard payout.",
    delayThreshold: 35,
    premiumPercentage: 200, // 2%
    protocolFee: 100, // 1%
    payoutPerIncident: 500, // 500 STX
    popular: false,
  },
  {
    id: "POL-002",
    name: "Premium Delay Protection", 
    description: "Enhanced coverage for high-value transactions with higher payouts.",
    delayThreshold: 30,
    premiumPercentage: 300, // 3%
    protocolFee: 150, // 1.5%
    payoutPerIncident: 1000, // 1000 STX
    popular: true,
  },
  {
    id: "POL-003",
    name: "Cross-Chain Delay Insurance",
    description: "Coverage for transactions across multiple blockchains with extended protection.",
    delayThreshold: 40,
    premiumPercentage: 250, // 2.5%
    protocolFee: 120, // 1.2%
    payoutPerIncident: 750, // 750 STX
    popular: false,
  },
]

export function PolicyPurchase() {
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [stxAmount, setStxAmount] = useState("")
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [purchaseId, setPurchaseId] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [blockHeight, setBlockHeight] = useState("")

  const handlePolicySelect = (policy) => {
    setSelectedPolicy(policy)
    setStxAmount("")
    setShowClaimForm(false)
  }

  const handlePurchase = (e) => {
    e.preventDefault()
    
    if (!selectedPolicy || !stxAmount || parseFloat(stxAmount) <= 0) {
      toast.error("Please select a policy and enter a valid STX amount")
      return
    }
    
    // Here you would typically send the purchase request to your backend
    console.log("Policy purchased:", {
      policyId: selectedPolicy.id,
      stxAmount: parseFloat(stxAmount),
    })
    
    // Show success notification
    toast.success("Policy purchased successfully", {
      description: `You've purchased ${selectedPolicy.name} coverage for ${stxAmount} STX.`,
    })
    
    // Generate a random purchase ID
    const randomId = `PURCHASE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    setPurchaseId(randomId)
    
    // Show claim form instead of resetting
    setShowClaimForm(true)
  }
  
  const handleClaim = (e) => {
    e.preventDefault()
    
    if (!transactionHash || !blockHeight) {
      toast.error("Please enter both transaction hash and block height")
      return
    }
    
    // Here you would typically send the claim request to your backend
    console.log("Claim submitted:", {
      purchaseId,
      transactionHash,
      blockHeight,
    })
    
    // Ensure we're using the toast correctly
    setTimeout(() => {
      // Show notification that transaction is not delayed
      toast.error("Transaction is not delayed, unable to claim", {
        description: "The transaction has not experienced sufficient delay to qualify for a claim.",
        duration: 5000, // Show for 5 seconds
      })
    }, 100)
  }

  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availablePolicies.map((policy) => (
          <Card 
            key={policy.id} 
            className={`relative overflow-hidden transition-all rounded-2xl border border-white/20 ${
              selectedPolicy?.id === policy.id 
                ? "border-primary shadow-lg" 
                : "hover:border-primary/50"
            }`}
          >
            {/* Background with blur effect similar to homepage */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "rgba(231, 236, 235, 0.08)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />
            {/* Additional subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
            
            {policy.popular && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="m-2 bg-primary text-primary-foreground">Popular</Badge>
              </div>
            )}
            <CardHeader className="relative z-10">
              <CardTitle className="text-foreground text-xl font-semibold">{policy.name}</CardTitle>
              <CardDescription className="text-muted-foreground">{policy.description}</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Delay Threshold:</span>
                  <span className="font-medium text-foreground">{policy.delayThreshold} blocks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Premium:</span>
                  <span className="font-medium text-foreground">{policy.premiumPercentage / 100}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Protocol Fee:</span>
                  <span className="font-medium text-foreground">{policy.protocolFee / 100}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payout per Incident:</span>
                  <span className="font-medium text-foreground">{policy.payoutPerIncident} STX</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="relative z-10">
              <Button 
                className={`w-full rounded-full font-medium shadow-sm ${
                  selectedPolicy?.id === policy.id 
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                    : "bg-white/10 text-foreground hover:bg-white/20"
                }`}
                onClick={() => handlePolicySelect(policy)}
              >
                {selectedPolicy?.id === policy.id ? (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Selected</>
                ) : (
                  <><Shield className="mr-2 h-4 w-4" /> Select Policy</>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPolicy && !showClaimForm && (
        <Card className="mt-8 overflow-hidden rounded-2xl border border-white/20">
          {/* Background with blur effect similar to homepage */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "rgba(231, 236, 235, 0.08)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          {/* Additional subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-foreground text-xl font-semibold">Purchase {selectedPolicy.name}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter the amount of STX you want to insure
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePurchase}>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stxAmount" className="text-foreground">STX Amount</Label>
                  <Input
                    id="stxAmount"
                    type="number"
                    placeholder="Enter STX amount"
                    value={stxAmount}
                    onChange={(e) => setStxAmount(e.target.value)}
                    min="1"
                    step="1"
                    className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                    required
                  />
                </div>
                
                {stxAmount && parseFloat(stxAmount) > 0 && (
                  <div className="rounded-xl border border-white/10 p-4 space-y-2 bg-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Premium Cost:</span>
                      <span className="font-medium text-foreground">
                        {((parseFloat(stxAmount) * selectedPolicy.premiumPercentage) / 10000).toFixed(2)} STX
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Protocol Fee:</span>
                      <span className="font-medium text-foreground">
                        {((parseFloat(stxAmount) * selectedPolicy.protocolFee) / 10000).toFixed(2)} STX
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-muted-foreground">Potential Payout:</span>
                      <span className="text-foreground">{selectedPolicy.payoutPerIncident} STX</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="relative z-10">
              <Button 
                type="submit" 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10"
              >
                Purchase Insurance
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {showClaimForm && (
        <Card className="mt-8 overflow-hidden rounded-2xl border border-white/20">
          {/* Background with blur effect similar to homepage */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "rgba(231, 236, 235, 0.08)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          {/* Additional subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-foreground text-xl font-semibold">Submit Insurance Claim</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your transaction details to claim insurance
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleClaim}>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 p-4 space-y-2 bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Policy:</span>
                    <span className="font-medium text-foreground">{selectedPolicy.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Purchase ID:</span>
                    <span className="font-medium text-foreground">{purchaseId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Insured Amount:</span>
                    <span className="font-medium text-foreground">{stxAmount} STX</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Potential Payout:</span>
                    <span className="font-medium text-foreground">{selectedPolicy.payoutPerIncident} STX</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transactionHash" className="text-foreground">Transaction Hash</Label>
                  <Input
                    id="transactionHash"
                    placeholder="Enter transaction hash"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockHeight" className="text-foreground">Block Height</Label>
                  <Input
                    id="blockHeight"
                    type="number"
                    placeholder="Enter block height"
                    value={blockHeight}
                    onChange={(e) => setBlockHeight(e.target.value)}
                    min="1"
                    step="1"
                    className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="relative z-10">
              <Button 
                type="submit" 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10"
              >
                Submit Claim
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
