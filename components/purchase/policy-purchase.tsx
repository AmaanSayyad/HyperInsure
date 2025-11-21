"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle, Shield, Loader2, ExternalLink } from "lucide-react"
import { useStacks } from "@/lib/stacks-provider"
import { ContractInteractions, formatSTX, parseSTX } from "@/lib/contract-utils"
import { APP_CONFIG } from "@/lib/stacks-config"

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
  const { isConnected, userSession, network } = useStacks()
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [stxAmount, setStxAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [contractInteractions, setContractInteractions] = useState<ContractInteractions | null>(null)

  // Initialize contract interactions
  useEffect(() => {
    if (network) {
      setContractInteractions(new ContractInteractions(network, userSession))
    }
  }, [network, userSession])

  // Fetch treasury balance
  useEffect(() => {
    const fetchTreasuryBalance = async () => {
      if (contractInteractions) {
        try {
          const balance = await contractInteractions.getTreasuryBalance()
          setTreasuryBalance(balance)
        } catch (error) {
          console.error('Error fetching treasury balance:', error)
        }
      }
    }

    fetchTreasuryBalance()
  }, [contractInteractions])

  const handlePolicySelect = (policy) => {
    setSelectedPolicy(policy)
    setStxAmount("")
    setShowClaimForm(false)
  }

  const handlePurchase = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    
    if (!selectedPolicy || !stxAmount || parseFloat(stxAmount) <= 0) {
      toast.error("Please select a policy and enter a valid STX amount")
      return
    }

    if (!contractInteractions) {
      toast.error("Contract interactions not initialized")
      return
    }
    
    setIsLoading(true)
    
    try {
      const coverageAmount = parseSTX(stxAmount)
      const premium = Math.floor((coverageAmount * selectedPolicy.premiumPercentage) / 10000)
      const duration = APP_CONFIG.DEFAULT_POLICY_DURATION
      
      // Call the purchase-policy function
      const result = await contractInteractions.purchasePolicy(
        coverageAmount,
        premium,
        duration
      )
      
      toast.success("Policy purchase transaction submitted", {
        description: `Transaction ID: ${result.txid}`,
        action: {
          label: "View",
          onClick: () => window.open(`${APP_CONFIG.EXPLORER_URL}&txid=${result.txid}`, '_blank')
        }
      })
      
      // Reset form
      setSelectedPolicy(null)
      setStxAmount("")
      
    } catch (error) {
      console.error('Error purchasing policy:', error)
      toast.error("Failed to purchase policy", {
        description: error.message || "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Treasury Status */}
      <Card className="mb-6 overflow-hidden rounded-2xl border border-white/20">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "rgba(231, 236, 235, 0.08)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
        <CardContent className="relative z-10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Treasury Status</h3>
              <p className="text-sm text-muted-foreground">Available for payouts</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {formatSTX(treasuryBalance)}
              </div>
              <div className="text-sm text-muted-foreground">
                Network: {APP_CONFIG.NETWORK.toUpperCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection Check */}
      {!isConnected && (
        <Card className="mb-6 overflow-hidden rounded-2xl border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800">
                Please connect your wallet to purchase insurance policies
              </p>
            </div>
          </CardContent>
        </Card>
      )}
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
                disabled={!isConnected || isLoading}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !isConnected ? (
                  "Connect Wallet to Purchase"
                ) : (
                  "Purchase Insurance"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
