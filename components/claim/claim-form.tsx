"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Loader2, ExternalLink, XCircle, Clock, Shield, FileText, Copy } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useStacks } from "@/lib/stacks-provider"
import { APP_CONFIG, CONTRACT_ADDRESSES, parseContractId } from "@/lib/stacks-config"
import { ContractInteractions, formatSTX } from "@/lib/contract-utils"
import { openContractCall } from "@stacks/connect"
import { uintCV, bufferCV, tupleCV, listCV, stringAsciiCV, AnchorMode, PostConditionMode } from "@stacks/transactions"
import Link from "next/link"

interface UserPurchase {
  purchaseId: string
  policyId: string
  policyName: string
  delayThreshold: number
  coverageAmount: number
  premiumPaid: number
  purchaseDate: Date
  expiryDate: Date
  status: "active" | "expired"
}

interface TransactionData {
  txid: string
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  fee: number
  size: number
  weight: number
}

interface DelayAnalysis {
  estimatedBroadcastHeight: number
  confirmationHeight: number
  delayBlocks: number
  delayMinutes: number
  feeRate: number
  isLowFee: boolean
  isDelayed: boolean
  reason: string
}

interface ClaimResult {
  transactionHash: string
  blockHeight: number
  blockHash: string
  confirmations: number
  isEligible: boolean
  delayAnalysis: DelayAnalysis
  fee: number
  txSize: number
  rejectionReason?: string
  requiredDelayThreshold?: number
}

const INSURANCE_CONFIG = {
  DELAY_THRESHOLD_BLOCKS: 35,
  MIN_CONFIRMATIONS: 6,
  LOW_FEE_THRESHOLD: 5,
  EXPECTED_BLOCK_TIME: 10,
}

// Generate unique claim ID
const generateClaimId = (): string => {
  return `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

export function ClaimForm() {
  const { isConnected, userAddress, userSession, network } = useStacks()
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("")
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([])
  const [txid, setTxid] = useState("")
  const [broadcastHeight, setBroadcastHeight] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const [txData, setTxData] = useState<TransactionData | null>(null)
  const [contractInteractions, setContractInteractions] = useState<ContractInteractions | null>(null)
  const [loadingPurchases, setLoadingPurchases] = useState(false)

  // Initialize contract interactions
  useEffect(() => {
    if (network && userSession) {
      try {
        setContractInteractions(new ContractInteractions(network, userSession))
      } catch (error) {
        console.error("Error initializing contract interactions:", error)
      }
    }
  }, [network, userSession])

  // Fetch user purchases
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!isConnected || !userAddress || !contractInteractions || !network) {
        setUserPurchases([])
        return
      }

      setLoadingPurchases(true)
      try {
        const storageKey = `hyperinsure_purchases_${userAddress}`
        const storedPurchases = localStorage.getItem(storageKey)
        const purchaseIds: string[] = storedPurchases ? JSON.parse(storedPurchases) : []
        
        console.log(`Found ${purchaseIds.length} purchase IDs for user ${userAddress}:`, purchaseIds)

        const purchases: UserPurchase[] = []

        for (let i = 0; i < purchaseIds.length; i++) {
          const purchaseId = purchaseIds[i]
          
          try {
            // Add delay between requests to avoid CORS rate limiting (especially on Vercel)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            const purchaseData = await contractInteractions.getPurchaseV2(purchaseId)
            
            // If contract data not available, use localStorage fallback
            if (!purchaseData || purchaseData === null) {
              console.log(`Purchase ${purchaseId} not found in contract, using localStorage fallback`)
              
              // Get purchase metadata from localStorage
              const metadataKey = `hyperinsure_purchase_metadata_${purchaseId}`
              const metadata = localStorage.getItem(metadataKey)
              
              if (metadata) {
                try {
                  const purchaseInfo = JSON.parse(metadata)
                  
                  // Fetch policy data (but don't fail if it's not available)
                  const policyId = purchaseInfo.policyId || "POL-001"
                  let policyData = null
                  try {
                    policyData = await contractInteractions.getPolicyV2(policyId)
                  } catch (policyError) {
                    console.warn(`Could not fetch policy ${policyId}, using defaults`)
                  }
                  
                  // Use localStorage data with policy info (or defaults)
                  const purchaseDate = new Date(purchaseInfo.timestamp || Date.now())
                  const expiryDate = new Date(purchaseDate.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days
                  const now = Date.now()
                  const isExpired = expiryDate.getTime() < now
                  
                  purchases.push({
                    purchaseId,
                    policyId,
                    policyName: policyData?.name || policyId,
                    delayThreshold: policyData ? parseInt(policyData["delay-threshold"]?.toString() || "35") : 35,
                    coverageAmount: purchaseInfo.coverageAmount || 100000000,
                    premiumPaid: purchaseInfo.premiumPaid || 2000000,
                    purchaseDate,
                    expiryDate,
                    status: isExpired ? "expired" : "active"
                  })
                  
                  console.log(`✅ Added purchase ${purchaseId} from localStorage (policy data: ${policyData ? 'available' : 'using defaults'})`)
                } catch (parseError) {
                  console.error(`Error parsing metadata for ${purchaseId}:`, parseError)
                }
              } else {
                // No metadata - create minimal fallback
                console.log(`No metadata for ${purchaseId}, creating minimal fallback`)
                purchases.push({
                  purchaseId,
                  policyId: "POL-001",
                  policyName: "Insurance Policy",
                  delayThreshold: 35,
                  coverageAmount: 100000000,
                  premiumPaid: 2000000,
                  purchaseDate: new Date(),
                  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  status: "active"
                })
                console.log(`✅ Added purchase ${purchaseId} with minimal fallback`)
              }
              continue
            }
            
            console.log(`Purchase ${purchaseId} raw data:`, purchaseData)
            
            // Extract purchaser address - now properly extracted by getPurchaseV2
            const purchaser = purchaseData.purchaser || ''
            const policyId = purchaseData["policy-id"] || ''
            
            // Convert both to strings for comparison
            const purchaserStr = String(purchaser).trim()
            const userAddressStr = String(userAddress).trim()
            
            console.log(`Purchase ${purchaseId} - Purchaser: "${purchaserStr}", User: "${userAddressStr}", Match: ${purchaserStr === userAddressStr}`)
            
            // Check if this purchase belongs to the current user
            if (purchaserStr === userAddressStr) {
              console.log(`Fetching policy ${policyId} for purchase ${purchaseId}`)
              
              try {
                // Add small delay before policy fetch
                await new Promise(resolve => setTimeout(resolve, 300))
                
                const policyData = await contractInteractions.getPolicyV2(policyId)
                console.log(`Policy ${policyId} data:`, policyData)
                
                if (policyData) {
                  // Data is now properly extracted by getPurchaseV2 and getPolicyV2
                  const createdAt = parseInt(purchaseData["created-at"]?.toString() || "0")
                  const expiry = parseInt(purchaseData.expiry?.toString() || "0")
                  const isActiveInContract = purchaseData.active === true
                  
                  const blocksToMs = 600000
                  const purchaseDate = new Date(Date.now() - (createdAt * blocksToMs))
                  const expiryDate = new Date(Date.now() + ((expiry - createdAt) * blocksToMs))
                  
                  const now = Date.now()
                  const isExpired = expiryDate.getTime() < now || !isActiveInContract
                  
                  console.log(`Purchase ${purchaseId} details:`, {
                    policyId,
                    policyName: policyData.name,
                    isActiveInContract,
                    isExpired,
                    expiryDate: expiryDate.toISOString(),
                    now: new Date(now).toISOString(),
                    status: isExpired ? "expired" : "active"
                  })
                  
                  purchases.push({
                    purchaseId,
                    policyId,
                    policyName: policyData.name || policyId,
                    delayThreshold: parseInt(policyData["delay-threshold"]?.toString() || "35"),
                    coverageAmount: parseInt(purchaseData["stx-amount"]?.toString() || "0"),
                    premiumPaid: parseInt(purchaseData["premium-paid"]?.toString() || "0"),
                    purchaseDate,
                    expiryDate,
                    status: isExpired ? "expired" : "active"
                  })
                  
                  console.log(`✅ Added purchase ${purchaseId} to list`)
                } else {
                  console.warn(`Policy ${policyId} not found for purchase ${purchaseId}`)
                }
              } catch (policyError) {
                console.error(`Error fetching policy ${policyId}:`, policyError)
              }
            } else {
              console.log(`Purchase ${purchaseId} belongs to different user, skipping`)
            }
          } catch (error: any) {
            // Check if it's a CORS/network error
            if (error?.message?.includes('Network error') || error?.message?.includes('CORS')) {
              console.warn(`CORS/Network error for purchase ${purchaseId}, stopping fetch to avoid rate limit`)
              break // Stop fetching more to avoid more CORS errors
            }
            console.error(`Error fetching purchase ${purchaseId}:`, error)
          }
        }

        const activePurchases = purchases.filter(p => p.status === "active")
        setUserPurchases(activePurchases)
        console.log(`Loaded ${activePurchases.length} active purchases out of ${purchases.length} total`)
        
        if (activePurchases.length === 0 && purchases.length > 0) {
          console.warn("All purchases are expired or inactive")
        }
      } catch (error) {
        console.error("Error fetching user purchases:", error)
        toast.error("Failed to load your purchases")
      } finally {
        setLoadingPurchases(false)
      }
    }

    fetchUserPurchases()
  }, [isConnected, userAddress, contractInteractions, network])

  const fetchBitcoinTx = async (txid: string): Promise<TransactionData> => {
    const apis = [
      `https://blockstream.info/api/tx/${txid}`,
      `https://mempool.space/api/tx/${txid}`,
    ]
    
    for (const apiUrl of apis) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) continue
        
        const data = await response.json()
        
        return {
          txid: data.txid,
          status: {
            confirmed: data.status?.confirmed || false,
            block_height: data.status?.block_height || 0,
            block_hash: data.status?.block_hash || '',
            block_time: data.status?.block_time || 0,
          },
          fee: data.fee || 0,
          size: data.size || data.vsize || 0,
          weight: data.weight || (data.size * 4) || 0,
        }
      } catch (error) {
        console.log(`API ${apiUrl} failed:`, error)
        continue
      }
    }
    
    throw new Error("Could not fetch transaction. Please check the TX ID.")
  }

  const getCurrentBlockHeight = async (): Promise<number> => {
    const apis = [
      "https://blockstream.info/api/blocks/tip/height",
      "https://mempool.space/api/blocks/tip/height",
    ]
    
    for (const apiUrl of apis) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        const response = await fetch(apiUrl, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!response.ok) continue
        const height = await response.json()
        return typeof height === 'number' ? height : parseInt(height)
      } catch (error) {
        continue
      }
    }
    throw new Error("Could not fetch current block height.")
  }

  const analyzeDelay = (
    tx: TransactionData, 
    currentHeight: number,
    userBroadcastHeight?: number,
    requiredThreshold?: number
  ): DelayAnalysis => {
    const confirmationHeight = tx.status.block_height
    const vsize = tx.weight ? Math.ceil(tx.weight / 4) : tx.size
    const feeRate = vsize > 0 ? tx.fee / vsize : 0
    const isLowFee = feeRate < INSURANCE_CONFIG.LOW_FEE_THRESHOLD
    
    let estimatedBroadcastHeight: number
    let reason: string
    
    if (userBroadcastHeight && userBroadcastHeight > 0) {
      estimatedBroadcastHeight = userBroadcastHeight
      reason = "User-provided broadcast height"
    } else if (isLowFee) {
      const estimatedWaitBlocks = Math.max(
        requiredThreshold || INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS,
        Math.floor(50 / (feeRate + 0.1))
      )
      estimatedBroadcastHeight = confirmationHeight - estimatedWaitBlocks
      reason = `Low fee rate (${feeRate.toFixed(2)} sat/vB) suggests mempool delay`
    } else {
      estimatedBroadcastHeight = confirmationHeight - 2
      reason = `Normal fee rate (${feeRate.toFixed(2)} sat/vB) - quick confirmation expected`
    }
    
    const delayBlocks = confirmationHeight - estimatedBroadcastHeight
    const delayMinutes = delayBlocks * INSURANCE_CONFIG.EXPECTED_BLOCK_TIME
    const threshold = requiredThreshold || INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS
    const isDelayed = delayBlocks >= threshold
    
    return {
      estimatedBroadcastHeight,
      confirmationHeight,
      delayBlocks,
      delayMinutes,
      feeRate,
      isLowFee,
      isDelayed,
      reason,
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPurchaseId) {
      toast.error("Please select a policy purchase")
      return
    }
    
    if (!txid) {
      toast.error("Please enter a Bitcoin transaction ID")
      return
    }
    
    const cleanTxid = txid.trim().toLowerCase().replace(/^0x/, '')
    if (!/^[a-f0-9]{64}$/.test(cleanTxid)) {
      toast.error("Invalid transaction ID format", {
        description: "Transaction ID must be 64 hexadecimal characters"
      })
      return
    }
    
    setLoading(true)
    setClaimResult(null)
    
    try {
      const tx = await fetchBitcoinTx(cleanTxid)
      setTxData(tx)
      
      if (!tx.status.confirmed) {
        toast.error("Transaction not confirmed yet", {
          description: "Please wait for the transaction to be confirmed on the Bitcoin network."
        })
        setLoading(false)
        return
      }

      const currentHeight = await getCurrentBlockHeight()
      const confirmations = currentHeight - tx.status.block_height + 1
      
      const selectedPurchase = userPurchases.find(p => p.purchaseId === selectedPurchaseId)
      const userBroadcastHeight = broadcastHeight ? parseInt(broadcastHeight) : undefined
      
      const delayAnalysis = analyzeDelay(tx, currentHeight, userBroadcastHeight, selectedPurchase?.delayThreshold)
      
      let isEligible = false
      let rejectionReason: string | undefined
      
      if (confirmations < INSURANCE_CONFIG.MIN_CONFIRMATIONS) {
        rejectionReason = `Insufficient confirmations (${confirmations}/${INSURANCE_CONFIG.MIN_CONFIRMATIONS} required)`
      } else if (!delayAnalysis.isDelayed) {
        rejectionReason = `Transaction was not delayed enough. Delay: ${delayAnalysis.delayBlocks} blocks (minimum ${selectedPurchase?.delayThreshold || INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} required)`
      } else {
        isEligible = true
      }
      
      setClaimResult({
        transactionHash: cleanTxid,
        blockHeight: tx.status.block_height,
        blockHash: tx.status.block_hash,
        confirmations,
        isEligible,
        delayAnalysis,
        fee: tx.fee,
        txSize: tx.size,
        rejectionReason,
        requiredDelayThreshold: selectedPurchase?.delayThreshold,
      })
      
      if (isEligible) {
        toast.success("Transaction eligible for claim!", {
          description: `Delayed by ${delayAnalysis.delayBlocks} blocks (~${delayAnalysis.delayMinutes} minutes)`,
        })
      } else {
        toast.warning("Transaction not eligible", {
          description: rejectionReason,
        })
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      toast.error("Failed to verify transaction", {
        description: error instanceof Error ? error.message : "Please check the transaction ID.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClaim = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!selectedPurchaseId) {
      toast.error("Please select a policy purchase")
      return
    }

    if (!claimResult || !txData) {
      toast.error("Please verify the transaction first")
      return
    }

    if (!claimResult.isEligible) {
      toast.error("Transaction not eligible for claim", {
        description: claimResult.rejectionReason
      })
      return
    }

    setSubmitting(true)

    try {
      const contractAddress = CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2
      if (!contractAddress) {
        toast.error("Contract not configured")
        setSubmitting(false)
        return
      }

      const { address, name } = parseContractId(contractAddress)
      const claimId = generateClaimId()
      
      const hexToUint8Array = (hex: string): Uint8Array => {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
        const bytes = new Uint8Array(cleanHex.length / 2)
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
        }
        return bytes
      }

      // For now, we'll use placeholder values for tx, header, and proof
      // In production, these should be fetched from Bitcoin APIs
      const txHashBytes = hexToUint8Array(claimResult.transactionHash)
      const txPlaceholder = new Uint8Array(256) // Placeholder - should be actual transaction bytes
      const headerPlaceholder = new Uint8Array(80) // Placeholder - should be actual block header

      const proof = tupleCV({
        'tx-index': uintCV(0),
        'hashes': listCV([]),
        'tree-depth': uintCV(0),
      })

      openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: 'submit-claim-with-proof',
        functionArgs: [
          stringAsciiCV(claimId),
          stringAsciiCV(selectedPurchaseId),
          bufferCV(txHashBytes),
          uintCV(claimResult.delayAnalysis.estimatedBroadcastHeight),
          uintCV(claimResult.blockHeight),
          bufferCV(txPlaceholder),
          bufferCV(headerPlaceholder),
          proof,
        ],
        network: {
          url: APP_CONFIG.STACKS_API_URL,
          chainId: APP_CONFIG.NETWORK === 'mainnet' ? 0x00000001 : 0x80000000,
        } as any,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
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
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 via-secondary/20 to-secondary/20 border border-secondary/40 flex items-center justify-center shadow-lg shadow-secondary/20">
                      <Shield className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-lg font-bold text-foreground mb-1.5">
                        Claim Submitted Successfully!
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Your insurance claim has been submitted and is being processed
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction ID Section */}
                  <div className="glass rounded-xl p-4 border border-white/10 bg-gradient-to-br from-secondary/5 via-secondary/3 to-transparent">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Transaction ID
                      </div>
                      <button
                        onClick={copyTxId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-secondary/40 transition-all text-xs font-medium text-foreground hover:text-secondary active:scale-95"
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
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-secondary/20 via-secondary/15 to-secondary/10 hover:from-secondary/30 hover:via-secondary/20 hover:to-secondary/15 border border-secondary/40 hover:border-secondary/60 transition-all text-sm font-semibold text-secondary hover:text-secondary/90 group shadow-lg shadow-secondary/10 hover:shadow-secondary/20 active:scale-[0.98]"
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
          setSubmitting(false)
          setClaimResult(null)
          setTxid("")
          setBroadcastHeight("")
        },
        onCancel: () => {
          toast.info("Claim cancelled")
          setSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error submitting claim:", error)
      toast.error("Failed to submit claim", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
      setSubmitting(false)
    }
  }

  const selectedPurchase = userPurchases.find(p => p.purchaseId === selectedPurchaseId)

  return (
    <div className="w-full space-y-6">
      <Card className="glass border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/15 to-secondary/10 border border-secondary/20">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Submit Insurance Claim</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
            Verify your delayed Bitcoin transaction and submit a claim
          </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-6 relative z-10">
            {!isConnected ? (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-foreground">Wallet Not Connected</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Please connect your wallet to submit a claim
                </AlertDescription>
              </Alert>
            ) : loadingPurchases ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading your purchases...</span>
              </div>
            ) : userPurchases.length === 0 ? (
            <Alert className="border-blue-500/50 bg-blue-500/10">
                <Shield className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-foreground">No Active Purchases</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  You don't have any active policy purchases. <Link href="/purchase" className="text-primary hover:underline">Purchase a policy</Link> first to submit claims.
              </AlertDescription>
            </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="purchaseId" className="text-foreground">Select Policy Purchase</Label>
                  <select
                    id="purchaseId"
                    value={selectedPurchaseId}
                    onChange={(e) => {
                      setSelectedPurchaseId(e.target.value)
                      setClaimResult(null)
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary [&>option]:text-black [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-gray-900"
                  >
                    <option value="" className="text-black bg-white dark:text-white dark:bg-gray-900">-- Select a purchase --</option>
                    {userPurchases.map((purchase) => (
                      <option key={purchase.purchaseId} value={purchase.purchaseId} className="text-black bg-white dark:text-white dark:bg-gray-900">
                        {purchase.policyName} - {purchase.purchaseId} (Threshold: {purchase.delayThreshold} blocks)
                      </option>
                    ))}
                  </select>
                  {selectedPurchase && (
                    <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Delay Threshold:</span> {selectedPurchase.delayThreshold} blocks
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your transaction must be delayed by at least {selectedPurchase.delayThreshold} blocks to be eligible
                      </p>
                    </div>
                  )}
                </div>

            <div className="space-y-2">
              <Label htmlFor="txid" className="text-foreground">Bitcoin Transaction ID</Label>
              <Input
                id="txid"
                placeholder="e.g., 819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461"
                value={txid}
                onChange={(e) => {
                  setTxid(e.target.value)
                  setClaimResult(null)
                }}
                disabled={loading}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcastHeight" className="text-foreground">
                Broadcast Block Height <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="broadcastHeight"
                type="number"
                placeholder="e.g., 924233"
                value={broadcastHeight}
                onChange={(e) => setBroadcastHeight(e.target.value)}
                disabled={loading}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                The block height when you broadcast the transaction. If not provided, delay will be estimated from fee rate.
              </p>
            </div>
              </>
            )}
          </CardContent>
          <div className="px-6 pb-6 relative z-10">
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
              disabled={loading || !isConnected || !selectedPurchaseId || userPurchases.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Transaction...
                </>
              ) : (
                "Verify & Analyze Delay"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {claimResult && (
        <Card className="glass border border-white/10 overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold text-foreground">Delay Analysis Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <Alert className={
              claimResult.isEligible 
                ? "border-green-500/50 bg-green-500/10" 
                : "border-red-500/50 bg-red-500/10"
            }>
              {claimResult.isEligible ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertTitle className="text-foreground">
                {claimResult.isEligible ? "✅ Eligible for Insurance Claim" : "❌ Not Eligible for Claim"}
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                {claimResult.isEligible 
                  ? `Transaction was delayed by ${claimResult.delayAnalysis.delayBlocks} blocks (~${claimResult.delayAnalysis.delayMinutes} minutes). You can submit a claim.`
                  : claimResult.rejectionReason
                }
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-xl border border-white/10 p-5 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-lg text-foreground">Delay Analysis</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Estimated Broadcast Height</div>
                  <div className="text-foreground font-mono font-semibold">{claimResult.delayAnalysis.estimatedBroadcastHeight.toLocaleString()}</div>
              </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Confirmation Height</div>
                  <div className="text-foreground font-mono font-semibold">{claimResult.delayAnalysis.confirmationHeight.toLocaleString()}</div>
              </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Delay</div>
                  <div className={`font-bold text-lg ${claimResult.delayAnalysis.isDelayed ? 'text-green-400' : 'text-red-400'}`}>
                  {claimResult.delayAnalysis.delayBlocks} blocks (~{claimResult.delayAnalysis.delayMinutes} min)
                    {claimResult.delayAnalysis.isDelayed ? ' ✓' : ` (need ${claimResult.requiredDelayThreshold || INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS}+)`}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Fee Rate</div>
                  <div className={`text-foreground font-semibold ${claimResult.delayAnalysis.isLowFee ? 'text-yellow-400' : ''}`}>
                    {claimResult.delayAnalysis.feeRate.toFixed(2)} sat/vB
                    {claimResult.delayAnalysis.isLowFee && (
                      <span className="ml-2 text-yellow-400 text-xs">(low fee)</span>
                    )}
              </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 p-5 bg-gradient-to-br from-accent/5 via-accent/3 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-lg text-foreground">Transaction Details</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Transaction ID</div>
                <div className="truncate font-mono text-xs text-foreground flex items-center gap-2">
                    {claimResult.transactionHash.slice(0, 20)}...
                  <a 
                    href={`https://www.blockchain.com/explorer/transactions/btc/${claimResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                  >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                  </a>
                </div>
              </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Confirmations</div>
                  <div className={`text-foreground font-semibold ${claimResult.confirmations >= INSURANCE_CONFIG.MIN_CONFIRMATIONS ? 'text-green-400' : 'text-red-400'}`}>
                  {claimResult.confirmations.toLocaleString()}
                  {claimResult.confirmations >= INSURANCE_CONFIG.MIN_CONFIRMATIONS ? ' ✓' : ` (need ${INSURANCE_CONFIG.MIN_CONFIRMATIONS}+)`}
                </div>
              </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Fee</div>
                  <div className="text-foreground font-semibold">{claimResult.fee.toLocaleString()} sats</div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Size</div>
                  <div className="text-foreground font-semibold">{claimResult.txSize} vB</div>
              </div>
              </div>
            </div>

            {claimResult.isEligible && (
              <Button 
                onClick={handleSubmitClaim}
                disabled={submitting || !isConnected || !selectedPurchaseId}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Claim...
                  </>
                ) : (
                  "Submit Insurance Claim"
                )}
              </Button>
            )}

            {!claimResult.isEligible && (
              <div className="text-center text-sm text-muted-foreground">
                <p>This transaction does not qualify for an insurance claim.</p>
                <p className="mt-1">Insurance covers transactions delayed by {claimResult.requiredDelayThreshold || INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS}+ blocks due to network congestion.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
