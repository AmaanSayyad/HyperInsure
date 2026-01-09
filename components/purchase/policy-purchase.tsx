"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle, Shield, Loader2, Sparkles, Zap, Crown, ArrowRight, Info, Copy, ExternalLink } from "lucide-react"
import { useStacks } from "@/lib/stacks-provider"
import { ContractInteractions, formatSTX, parseSTX } from "@/lib/contract-utils"
import { APP_CONFIG, CONTRACT_ADDRESSES, parseContractId } from "@/lib/stacks-config"
import { openContractCall } from "@stacks/connect"
import { uintCV, stringAsciiCV, AnchorMode, PostConditionMode } from "@stacks/transactions"

interface Policy {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  delayThreshold: number;
  premiumPercentage: number;
  protocolFee: number;
  payoutPerIncident: number;
  popular: boolean;
  features: string[];
}

const availablePolicies: Policy[] = [
  {
    id: "POL-001",
    name: "Starter",
    description: "Perfect for casual transactions",
    icon: Zap,
    delayThreshold: 35,
    premiumPercentage: 200,
    protocolFee: 100,
    payoutPerIncident: 500,
    popular: false,
    features: [
      "35 block delay threshold",
      "2% premium rate",
      "Standard support"
    ]
  },
  {
    id: "POL-002",
    name: "Professional", 
    description: "For active traders",
    icon: Sparkles,
    delayThreshold: 30,
    premiumPercentage: 300,
    protocolFee: 150,
    payoutPerIncident: 1000,
    popular: true,
    features: [
      "30 block delay threshold",
      "3% premium rate",
      "Priority support",
      "Advanced analytics"
    ]
  },
  {
    id: "POL-003",
    name: "Enterprise",
    description: "Maximum protection",
    icon: Crown,
    delayThreshold: 40,
    premiumPercentage: 250,
    protocolFee: 120,
    payoutPerIncident: 750,
    popular: false,
    features: [
      "40 block delay threshold",
      "2.5% premium rate",
      "24/7 premium support",
      "Custom SLAs"
    ]
  },
]

// Generate purchase ID (max 36 characters as per contract requirement)
function generatePurchaseId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 11)
  // Ensure total length is <= 36 characters
  const id = `PUR-${timestamp}-${random}`
  // Contract requires string-ascii 36, so truncate if needed
  return id.length > 36 ? id.substring(0, 36) : id
}

export function PolicyPurchase() {
  const { isConnected, userSession, network, userAddress } = useStacks()
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [stxAmount, setStxAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [contractInteractions, setContractInteractions] = useState<ContractInteractions | null>(null)

  useEffect(() => {
    if (network) {
      setContractInteractions(new ContractInteractions(network, userSession))
    }
  }, [network, userSession])

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

  const handlePolicySelect = (policy: Policy) => {
    setSelectedPolicy(policy)
    setStxAmount("")
  }

  const calculatePremium = (amount: string, policy: Policy) => {
    if (!amount || parseFloat(amount) <= 0) return "0"
    const coverageAmount = parseSTX(amount)
    const premium = (coverageAmount * policy.premiumPercentage) / 10000
    return formatSTX(premium)
  }

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    
    if (!selectedPolicy || !stxAmount || parseFloat(stxAmount) <= 0) {
      toast.error("Please select a policy and enter a valid STX amount")
      return
    }

    // Use HYPERINSURE_CORE_V2 if available, otherwise fall back to POLICY_MANAGER
    const contractAddress = CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2 || CONTRACT_ADDRESSES.POLICY_MANAGER
    if (!contractAddress) {
      toast.error("Insurance contract not configured")
      return
    }
    
    setIsLoading(true)
    
    try {
      const coverageAmount = parseSTX(stxAmount)
      const { address, name } = parseContractId(contractAddress)
      
      // Determine which contract we're using and call appropriate function
      const isCoreV2 = !!CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2
      
      // Generate purchase ID for HYPERINSURE_CORE_V2
      const purchaseId = generatePurchaseId()
      
      // Optional: Try to verify policy exists (non-blocking, just for user info)
      if (isCoreV2 && contractInteractions) {
        try {
          const policyData = await contractInteractions.getPolicyV2(selectedPolicy.id)
          if (!policyData) {
            console.warn(`Policy ${selectedPolicy.id} not found in HYPERINSURE_CORE_V2, but proceeding with purchase attempt`)
          } else {
            const isActive = policyData.active?.value === true || policyData.active === true
            if (!isActive) {
              console.warn(`Policy ${selectedPolicy.id} exists but is inactive`)
            }
          }
        } catch (error) {
          // Non-blocking - just log the error and proceed
          console.warn("Could not verify policy existence, proceeding with purchase:", error)
        }
      }
      
      await openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: isCoreV2 ? 'purchase-policy' : 'purchase-policy',
        functionArgs: isCoreV2 ? [
          stringAsciiCV(selectedPolicy.id), // policy-id
          uintCV(coverageAmount), // stx-amount (in microSTX)
          stringAsciiCV(purchaseId), // purchase-id
        ] : [
          uintCV(coverageAmount),
          uintCV(Math.floor((coverageAmount * selectedPolicy.premiumPercentage) / 10000)),
          uintCV(APP_CONFIG.DEFAULT_POLICY_DURATION),
        ],
        network: {
          url: 'https://api.testnet.hiro.so',
          chainId: 0x80000000,
        } as any,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          const explorerUrl = `https://explorer.hiro.so/txid/${data.txId}?chain=${APP_CONFIG.NETWORK}`
          const copyTxId = () => {
            navigator.clipboard.writeText(data.txId)
            toast.success("Copied to clipboard!", { duration: 2000 })
          }
          
          toast.custom(
            (t) => (
              <div className={`glass rounded-2xl p-6 border border-white/10 shadow-2xl min-w-[420px] max-w-[500px] transition-all duration-300 ${t.visible ? 'animate-in slide-in-from-top-5' : 'animate-out slide-out-to-top-5'}`}>
                <div className="flex flex-col gap-5">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-400/20 border border-green-500/40 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-lg font-bold text-foreground mb-1.5">
                        Policy Purchase Successful!
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Your insurance policy has been activated on-chain
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction ID Section */}
                  <div className="glass rounded-xl p-4 border border-white/10 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Transaction ID
                      </div>
                      <button
                        onClick={copyTxId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all text-xs font-medium text-foreground hover:text-primary active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-white/5 backdrop-blur-sm">
                      <code className="text-xs font-mono text-foreground/90 break-all flex-1 leading-relaxed">
                        {data.txId}
                      </code>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => {
                      window.open(explorerUrl, '_blank')
                      toast.dismiss(t.id)
                    }}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 hover:from-primary/30 hover:via-primary/20 hover:to-primary/15 border border-primary/40 hover:border-primary/60 transition-all text-sm font-semibold text-primary hover:text-primary/90 group shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    View on Explorer
                  </button>
                </div>
              </div>
            ),
            {
              duration: 12000,
            }
          )
          
          // Track purchase ID in localStorage for dashboard
          if (userAddress && isCoreV2) {
            try {
              const storageKey = `hyperinsure_purchases_${userAddress}`
              const existingPurchases = localStorage.getItem(storageKey)
              const purchases: string[] = existingPurchases ? JSON.parse(existingPurchases) : []
              if (!purchases.includes(purchaseId)) {
                purchases.push(purchaseId)
                localStorage.setItem(storageKey, JSON.stringify(purchases))
              }
            } catch (error) {
              console.error("Error saving purchase ID:", error)
            }
          }
          
          setSelectedPolicy(null)
          setStxAmount("")
          setIsLoading(false)
        },
        onCancel: () => {
          toast.info("Transaction cancelled")
          setIsLoading(false)
        },
      })
      
    } catch (error) {
      console.error('Error purchasing policy:', error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      
      // Provide more helpful error messages
      let userMessage = "Failed to purchase policy"
      let description = errorMessage
      
      if (errorMessage.includes("ERR_POLICY_NOT_FOUND") || errorMessage.includes("policy not found")) {
        userMessage = "Policy Not Found"
        description = `The policy "${selectedPolicy?.id}" does not exist in the contract. Please ensure the admin has created this policy first.`
      } else if (errorMessage.includes("ERR_POLICY_INACTIVE") || errorMessage.includes("inactive")) {
        userMessage = "Policy Inactive"
        description = `The policy "${selectedPolicy?.id}" is not currently active.`
      } else if (errorMessage.includes("ERR_INSUFFICIENT_FUNDS") || errorMessage.includes("insufficient")) {
        userMessage = "Insufficient Funds"
        description = "You don't have enough STX to cover the premium and fees."
      } else if (errorMessage.includes("ERR_PURCHASE_EXISTS")) {
        userMessage = "Purchase ID Exists"
        description = "This purchase ID already exists. Please try again."
      }
      
      toast.error(userMessage, {
        description: description
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Treasury Status Banner */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/10">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Treasury Balance</div>
              <div className="text-2xl font-bold text-gradient">
                {formatSTX(treasuryBalance)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Network: {APP_CONFIG.NETWORK.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Connection Alert */}
      {!isConnected && (
        <div className="glass rounded-2xl p-6 border border-accent/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <div className="font-semibold text-foreground mb-1">Connect Your Wallet</div>
              <div className="text-sm text-muted-foreground">
                Connect your Stacks wallet to purchase insurance policies
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {availablePolicies.map((policy) => {
          const Icon = policy.icon
          const isSelected = selectedPolicy?.id === policy.id
          
          return (
            <div
              key={policy.id}
              onClick={() => handlePolicySelect(policy)}
              className={`group relative rounded-3xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? "bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary shadow-2xl shadow-primary/20 scale-105"
                  : policy.popular
                  ? "glass border-2 border-accent/30 hover:border-accent/50"
                  : "glass border border-white/10 hover:border-white/20"
              }`}
            >
              {policy.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-accent text-black text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {isSelected && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Icon & Name */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isSelected ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/10"
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                </div>

                {/* Premium Rate Display */}
                <div className="py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gradient">
                      {(policy.premiumPercentage / 100).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">premium rate</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Delay threshold: {policy.delayThreshold} blocks
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {policy.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className={`p-0.5 rounded-full ${
                        isSelected ? "bg-primary/20" : "bg-white/5"
                      }`}>
                        <CheckCircle className={`w-3 h-3 ${
                          isSelected ? "text-primary" : "text-foreground/50"
                        }`} />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Purchase Form */}
      {selectedPolicy && (
        <form onSubmit={handlePurchase} className="glass rounded-3xl p-8 border border-primary/30 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Complete Your Purchase</h3>
              <p className="text-muted-foreground">Configure your coverage amount</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stxAmount" className="text-sm font-medium text-foreground">
                Coverage Amount (STX)
              </Label>
              <Input
                id="stxAmount"
                type="number"
                step="0.000001"
                placeholder="Enter STX amount"
                value={stxAmount}
                onChange={(e) => setStxAmount(e.target.value)}
                className="h-12 bg-white/5 border-white/10 focus:border-primary rounded-xl text-lg"
                disabled={isLoading}
              />
            </div>

            {stxAmount && parseFloat(stxAmount) > 0 && (
              <div className="glass rounded-xl p-4 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Premium Rate</span>
                  <span className="text-foreground font-medium">
                    {(selectedPolicy.premiumPercentage / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Premium Amount</span>
                  <span className="text-foreground font-medium">
                    {calculatePremium(stxAmount, selectedPolicy)} STX
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Protocol Fee</span>
                  <span className="text-foreground font-medium">
                    {(selectedPolicy.protocolFee / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-muted-foreground">Delay Threshold</span>
                  <span className="text-gradient font-bold">
                    {selectedPolicy.delayThreshold} blocks
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  Coverage applies if delay exceeds this threshold
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isConnected || isLoading || !stxAmount || parseFloat(stxAmount) <= 0}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Purchase Coverage
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
