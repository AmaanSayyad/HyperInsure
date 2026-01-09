"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { useStacks } from "@/lib/stacks-provider"
import { openContractCall } from "@stacks/connect"
import { stringAsciiCV, stringUtf8CV, uintCV, AnchorMode, PostConditionMode } from "@stacks/transactions"
import { CONTRACT_ADDRESSES, parseContractId, APP_CONFIG } from "@/lib/stacks-config"
import { ContractInteractions } from "@/lib/contract-utils"
import { Copy, ExternalLink, CheckCircle, Shield, Sparkles, Info, TrendingUp, DollarSign, Clock, FileText } from "lucide-react"

export function PolicyCreator() {
  const { isConnected, userSession, network } = useStacks()
  
  // Get next available policy ID
  const getNextPolicyId = () => {
    if (typeof window === 'undefined') return "POL-004"
    try {
      const stored = localStorage.getItem('hyperinsure_created_policies')
      const policyIds: string[] = stored ? JSON.parse(stored) : []
      
      // Check existing IDs and find next available
      const existingIds = ["POL-001", "POL-002", "POL-003", ...policyIds]
      for (let i = 4; i <= 999; i++) {
        const candidateId = `POL-${String(i).padStart(3, '0')}`
        if (!existingIds.includes(candidateId)) {
          return candidateId
        }
      }
      return "POL-004" // Fallback
    } catch {
      return "POL-004"
    }
  }
  
  const [formData, setFormData] = useState({
    policyId: getNextPolicyId(),
    policyName: "",
    delayThreshold: 35,
    policyDescription: "",
    premiumPercentage: 200, // Default 2% (200 basis points)
    protocolFee: 100, // Default 1% (100 basis points)
    payoutPerIncident: 500, // Default 500 STX (in microSTX: 500000000)
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!formData.policyId || !formData.policyName) {
      toast.error("Please fill in Policy ID and Policy Name")
      return
    }

    // Validate policy ID length (max 20 characters for string-ascii 20)
    if (formData.policyId.length > 20) {
      toast.error("Policy ID must be 20 characters or less")
      return
    }

    // Validate name length (max 100 characters for string-ascii 100)
    if (formData.policyName.length > 100) {
      toast.error("Policy Name must be 100 characters or less")
      return
    }

    // Validate description length (max 500 characters for string-utf8 500)
    if (formData.policyDescription.length > 500) {
      toast.error("Policy Description must be 500 characters or less")
      return
    }

    // Validate required fields
    if (!formData.policyDescription.trim()) {
      toast.error("Policy Description is required")
      return
    }

    const contractAddress = CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2 || CONTRACT_ADDRESSES.HYPERINSURE_CORE
    if (!contractAddress) {
      toast.error("Contract address not configured")
      return
    }

    // Check if user is admin before proceeding
    if (!network) {
      toast.error("Network not initialized")
      return
    }

    setIsLoading(true)

    try {
      // Verify user is admin
      const contractInteractions = new ContractInteractions(network, userSession || null)
      const adminAddress = await contractInteractions.getAdminV2()
      const userAddress = userSession?.loadUserData()?.profile?.stxAddress?.testnet || userSession?.loadUserData()?.profile?.stxAddress?.mainnet
      
      if (!adminAddress) {
        toast.error("Unable to verify admin address. Please try again.")
        setIsLoading(false)
        return
      }

      if (userAddress !== adminAddress) {
        toast.error("Unauthorized", {
          description: `Only the contract admin (${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}) can create policies. Your address: ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}`,
          duration: 10000,
        })
        setIsLoading(false)
        return
      }

      const { address, name } = parseContractId(contractAddress)
    
      // Convert payout to microSTX
      const payoutMicroSTX = formData.payoutPerIncident * 1000000

      // Ensure description is not empty
      const description = formData.policyDescription.trim() || "Insurance policy for transaction delay protection"

      console.log("Creating policy with:", {
        policyId: formData.policyId,
        name: formData.policyName,
        description: description.substring(0, 50) + "...",
        delayThreshold: formData.delayThreshold,
        premiumPercentage: formData.premiumPercentage,
        protocolFee: formData.protocolFee,
        payoutMicroSTX: payoutMicroSTX,
      })

      await openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: 'create-policy',
        functionArgs: [
          stringAsciiCV(formData.policyId), // policy-id (string-ascii 20)
          stringAsciiCV(formData.policyName), // name (string-ascii 100)
          stringUtf8CV(description), // description (string-utf8 500) - FIXED: use stringUtf8CV
          uintCV(formData.delayThreshold), // delay-threshold (uint)
          uintCV(formData.premiumPercentage), // premium-percentage (uint, basis points)
          uintCV(formData.protocolFee), // protocol-fee (uint, basis points)
          uintCV(payoutMicroSTX), // payout-per-incident (uint, in microSTX)
        ],
        network: {
          url: 'https://api.testnet.hiro.so',
          chainId: 0x80000000,
        } as any,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          // Track the created policy ID
          try {
            const stored = localStorage.getItem('hyperinsure_created_policies')
            const policyIds: string[] = stored ? JSON.parse(stored) : []
            if (!policyIds.includes(formData.policyId)) {
              policyIds.push(formData.policyId)
              localStorage.setItem('hyperinsure_created_policies', JSON.stringify(policyIds))
            }
          } catch (error) {
            console.error("Error saving policy ID:", error)
          }

          const explorerUrl = `${APP_CONFIG.EXPLORER_URL}/txid/${data.txId}?chain=${APP_CONFIG.NETWORK}`
          const copyTxId = () => {
            navigator.clipboard.writeText(data.txId)
            toast.success("Copied to clipboard!", { duration: 2000 })
          }
          
          toast.custom(
            (t: any) => (
              <div className={`glass rounded-2xl p-6 border border-white/10 shadow-2xl min-w-[420px] max-w-[500px] transition-all duration-300 ${t?.visible ? 'animate-in slide-in-from-top-5' : 'animate-out slide-out-to-top-5'}`}>
                <div className="flex flex-col gap-5">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-lg font-bold text-foreground mb-1.5">
                        Policy Created Successfully!
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Policy "{formData.policyName}" ({formData.policyId}) has been created on-chain
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
                      toast.dismiss(t?.id)
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
    
    // Reset form
    setFormData({
            policyId: "",
      policyName: "",
      delayThreshold: 35,
      policyDescription: "",
            premiumPercentage: 200,
            protocolFee: 100,
      payoutPerIncident: 500,
    })
          setIsLoading(false)
        },
        onCancel: () => {
          toast.info("Transaction cancelled")
          setIsLoading(false)
        },
      })
    } catch (error: any) {
      console.error('Error creating policy:', error)
      
      const errorMessage = error?.message || error?.toString() || "Unknown error"
      let userMessage = "Failed to create policy"
      let description = errorMessage
      
      // Provide more helpful error messages
      if (errorMessage.includes("ERR_UNAUTHORIZED") || errorMessage.includes("unauthorized")) {
        userMessage = "Unauthorized"
        description = "You are not authorized to create policies. Only the contract admin can create policies."
      } else if (errorMessage.includes("ERR_POLICY_EXISTS") || errorMessage.includes("already exists")) {
        userMessage = "Policy Already Exists"
        description = `Policy ID "${formData.policyId}" already exists. Please use a different Policy ID.`
      } else if (errorMessage.includes("ERR_INVALID_PARAMETER") || errorMessage.includes("invalid")) {
        userMessage = "Invalid Parameters"
        description = "One or more parameters are invalid. Please check your input values."
      } else if (errorMessage.includes("rejected") || errorMessage.includes("reject")) {
        userMessage = "Transaction Rejected"
        description = "The transaction was rejected. This could be due to: 1) You're not the admin, 2) Policy ID already exists, 3) Invalid parameters. Check the console for details."
      }
      
      toast.error(userMessage, {
        description: description,
        duration: 8000,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="glass border border-white/10 overflow-hidden rounded-3xl relative">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-6">
          <div className="flex items-start gap-4 mb-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                Create New Insurance Policy
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base leading-relaxed">
                Define parameters for a new transaction delay insurance policy. All values are stored on-chain and cannot be modified after creation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 relative z-10 pt-2">
            {!isConnected && (
              <div className="p-5 rounded-2xl glass border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Info className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-sm font-semibold text-yellow-300">
                    Please connect your wallet to create policies
                  </p>
                </div>
              </div>
            )}
            
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="policyId" className="text-foreground font-semibold flex items-center gap-2">
                  <span>Policy ID</span>
                  <span className="text-xs font-normal text-muted-foreground">(max 20 characters, must be unique)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="policyId"
                    name="policyId"
                    placeholder="e.g., POL-004"
                    value={formData.policyId}
                    onChange={handleInputChange}
                    className="border-white/10 bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-12 text-base transition-all"
                    required
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, policyId: getNextPolicyId() }))}
                    className="whitespace-nowrap px-6 rounded-xl border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all"
                    title="Generate next available Policy ID"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Next ID
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>Suggested: <span className="font-mono font-semibold text-foreground/80">{getNextPolicyId()}</span>. Each policy ID must be unique.</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="policyName" className="text-foreground font-semibold">Policy Name</Label>
                <Input
                  id="policyName"
                  name="policyName"
                  placeholder="e.g., Standard Transaction Delay Coverage"
                  value={formData.policyName}
                  onChange={handleInputChange}
                  className="border-white/10 bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-12 text-base transition-all"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="policyDescription" className="text-foreground font-semibold">Policy Description</Label>
                <Textarea
                  id="policyDescription"
                  name="policyDescription"
                  placeholder="Describe the coverage details and conditions..."
                  value={formData.policyDescription}
                  onChange={handleInputChange}
                  className="border-white/10 bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl min-h-[120px] text-base transition-all resize-none"
                  required
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Provide clear details about coverage terms and conditions</span>
                  </span>
                  <span className="font-mono">{formData.policyDescription.length}/500</span>
                </div>
              </div>
            </div>
            
            {/* Policy Parameters Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Policy Parameters</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Delay Threshold */}
                <div className="space-y-4 p-5 rounded-2xl glass border border-white/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delayThreshold" className="text-foreground font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Delay Threshold
                    </Label>
                    <div className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                      <span className="text-lg font-bold text-primary">{formData.delayThreshold}</span>
                      <span className="text-xs text-muted-foreground ml-1">blocks</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Slider
                      id="delayThreshold"
                      min={10}
                      max={100}
                      step={1}
                      defaultValue={[formData.delayThreshold]}
                      onValueChange={(value) => handleSliderChange("delayThreshold", value)}
                      className="py-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Number of blocks before a transaction is considered delayed</span>
                  </p>
                </div>
                
                {/* Premium Percentage */}
                <div className="space-y-4 p-5 rounded-2xl glass border border-white/10 bg-gradient-to-br from-accent/5 via-transparent to-transparent hover:border-accent/30 transition-all">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="premiumPercentage" className="text-foreground font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      Premium Rate
                    </Label>
                    <div className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30">
                      <span className="text-lg font-bold text-accent">{formData.premiumPercentage/100}%</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Slider
                      id="premiumPercentage"
                      min={10}
                      max={1000}
                      step={10}
                      value={[formData.premiumPercentage]}
                      onValueChange={(value) => handleSliderChange("premiumPercentage", value)}
                      className="py-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Premium as % of coverage (100 = 1%, 200 = 2%, 1000 = 10%)</span>
                  </p>
                </div>
                
                {/* Protocol Fee */}
                <div className="space-y-4 p-5 rounded-2xl glass border border-white/10 bg-gradient-to-br from-secondary/5 via-transparent to-transparent hover:border-secondary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="protocolFee" className="text-foreground font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-secondary" />
                      Protocol Fee
                    </Label>
                    <div className="px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/30">
                      <span className="text-lg font-bold text-secondary">{formData.protocolFee/100}%</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Slider
                      id="protocolFee"
                      min={10}
                      max={500}
                      step={10}
                      value={[formData.protocolFee]}
                      onValueChange={(value) => handleSliderChange("protocolFee", value)}
                      className="py-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Protocol fee percentage (100 = 1%, 150 = 1.5%)</span>
                  </p>
                </div>
                
                {/* Payout per Incident */}
                <div className="space-y-4 p-5 rounded-2xl glass border border-white/10 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payoutPerIncident" className="text-foreground font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Payout per Incident
                    </Label>
                    <div className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                      <span className="text-lg font-bold text-primary">{formData.payoutPerIncident}</span>
                      <span className="text-xs text-muted-foreground ml-1">STX</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Slider
                      id="payoutPerIncident"
                      min={100}
                      max={10000}
                      step={100}
                      value={[formData.payoutPerIncident]}
                      onValueChange={(value) => handleSliderChange("payoutPerIncident", value)}
                      className="py-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Fixed amount paid out for each valid claim (in STX)</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="relative z-10 pt-6">
            <Button 
              type="submit" 
              disabled={!isConnected || isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-2xl font-semibold text-base shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Creating Policy...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Create Policy</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
