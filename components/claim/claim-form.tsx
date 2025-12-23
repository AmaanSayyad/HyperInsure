"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Loader2, ExternalLink, XCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useStacks } from "@/lib/stacks-provider"
import { APP_CONFIG, CONTRACT_ADDRESSES, parseContractId } from "@/lib/stacks-config"
import { openContractCall } from "@stacks/connect"
import { uintCV, bufferCV, tupleCV, listCV, AnchorMode, PostConditionMode } from "@stacks/transactions"

// Insurance configuration
const INSURANCE_CONFIG = {
  DELAY_THRESHOLD_BLOCKS: 35, // Minimum blocks delay for claim eligibility
  MIN_CONFIRMATIONS: 6,       // Minimum confirmations required
  LOW_FEE_THRESHOLD: 5,       // sat/vB - transactions below this are considered "low fee"
  EXPECTED_BLOCK_TIME: 10,    // minutes per block
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
  firstSeen?: number // Timestamp when TX was first seen in mempool (if available)
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
}

export function ClaimForm() {
  const { isConnected } = useStacks()
  const [txid, setTxid] = useState("")
  const [policyId, setPolicyId] = useState("")
  const [broadcastHeight, setBroadcastHeight] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const [txData, setTxData] = useState<TransactionData | null>(null)

  const fetchBitcoinTx = async (txid: string): Promise<TransactionData> => {
    console.log("Fetching Bitcoin TX:", txid)
    
    const apis = [
      `https://blockstream.info/api/tx/${txid}`,
      `https://mempool.space/api/tx/${txid}`,
    ]
    
    for (const apiUrl of apis) {
      try {
        console.log("Trying API:", apiUrl)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) continue
        
        const data = await response.json()
        console.log("TX Data from", apiUrl, ":", data)
        
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

  // Analyze transaction delay for insurance eligibility
  const analyzeDelay = (
    tx: TransactionData, 
    currentHeight: number,
    userBroadcastHeight?: number
  ): DelayAnalysis => {
    const confirmationHeight = tx.status.block_height
    const vsize = tx.weight ? Math.ceil(tx.weight / 4) : tx.size
    const feeRate = vsize > 0 ? tx.fee / vsize : 0
    const isLowFee = feeRate < INSURANCE_CONFIG.LOW_FEE_THRESHOLD
    
    // Calculate delay
    let estimatedBroadcastHeight: number
    let reason: string
    
    if (userBroadcastHeight && userBroadcastHeight > 0) {
      // User provided broadcast height
      estimatedBroadcastHeight = userBroadcastHeight
      reason = "User-provided broadcast height"
    } else if (isLowFee) {
      // Low fee transactions likely waited in mempool
      // Estimate based on fee rate - lower fee = longer wait
      const estimatedWaitBlocks = Math.max(
        INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS,
        Math.floor(50 / (feeRate + 0.1)) // Lower fee = more blocks waited
      )
      estimatedBroadcastHeight = confirmationHeight - estimatedWaitBlocks
      reason = `Low fee rate (${feeRate.toFixed(2)} sat/vB) suggests mempool delay`
    } else {
      // Normal/high fee - assume quick confirmation (1-3 blocks)
      estimatedBroadcastHeight = confirmationHeight - 2
      reason = `Normal fee rate (${feeRate.toFixed(2)} sat/vB) - quick confirmation expected`
    }
    
    const delayBlocks = confirmationHeight - estimatedBroadcastHeight
    const delayMinutes = delayBlocks * INSURANCE_CONFIG.EXPECTED_BLOCK_TIME
    const isDelayed = delayBlocks >= INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS
    
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
    
    if (!txid) {
      toast.error("Please enter a Bitcoin transaction ID")
      return
    }
    
    // Validate txid format (64 hex characters)
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
      
      // Parse user-provided broadcast height if available
      const userBroadcastHeight = broadcastHeight ? parseInt(broadcastHeight) : undefined
      
      // Analyze delay for insurance eligibility
      const delayAnalysis = analyzeDelay(tx, currentHeight, userBroadcastHeight)
      
      // Determine eligibility
      let isEligible = false
      let rejectionReason: string | undefined
      
      if (confirmations < INSURANCE_CONFIG.MIN_CONFIRMATIONS) {
        rejectionReason = `Insufficient confirmations (${confirmations}/${INSURANCE_CONFIG.MIN_CONFIRMATIONS} required)`
      } else if (!delayAnalysis.isDelayed) {
        rejectionReason = `Transaction was not delayed. Delay: ${delayAnalysis.delayBlocks} blocks (minimum ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} required)`
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

    if (!policyId) {
      toast.error("Please enter your Policy ID")
      return
    }

    const cleanPolicyId = policyId.replace(/^0x/i, '').trim()
    if (cleanPolicyId.length > 10 || /[a-fA-F]/.test(cleanPolicyId)) {
      toast.error("Invalid Policy ID", {
        description: "Policy ID should be a simple number (1, 2, 3...), not a transaction hash."
      })
      return
    }

    const policyIdNum = parseInt(cleanPolicyId, 10)
    if (isNaN(policyIdNum) || policyIdNum <= 0 || policyIdNum > 1000000) {
      toast.error("Invalid Policy ID", {
        description: "Policy ID must be a positive number between 1 and 1,000,000"
      })
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
      const claimProcessorContract = CONTRACT_ADDRESSES.CLAIM_PROCESSOR
      if (!claimProcessorContract) {
        toast.error("Claim Processor contract not configured")
        setSubmitting(false)
        return
      }

      const { address, name } = parseContractId(claimProcessorContract)
      
      const hexToUint8Array = (hex: string): Uint8Array => {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
        const bytes = new Uint8Array(cleanHex.length / 2)
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
        }
        return bytes
      }

      const proof = tupleCV({
        'tx-index': uintCV(0),
        'hashes': listCV([]),
        'tree-depth': uintCV(0),
      })

      openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: 'submit-claim',
        functionArgs: [
          uintCV(policyIdNum),
          bufferCV(hexToUint8Array(txid)),
          bufferCV(hexToUint8Array(txData.status.block_hash)),
          proof,
        ],
        network: {
          url: 'https://api.testnet.hiro.so',
          chainId: 0x80000000,
        } as any,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          toast.success("Claim submitted successfully!", {
            description: `Transaction ID: ${data.txId}`,
            action: {
              label: "View",
              onClick: () => window.open(`https://explorer.hiro.so/txid/${data.txId}?chain=${APP_CONFIG.NETWORK}`, '_blank')
            }
          })
          setSubmitting(false)
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-2xl border border-white/20">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "rgba(231, 236, 235, 0.08)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl font-semibold text-foreground">Submit Insurance Claim</CardTitle>
          <CardDescription className="text-muted-foreground">
            Verify your delayed Bitcoin transaction and submit a claim
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-6 relative z-10">
            {/* Insurance Requirements Info */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-foreground">Insurance Requirements</AlertTitle>
              <AlertDescription className="text-muted-foreground text-sm">
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Transaction must be delayed by at least <strong>{INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} blocks</strong> (~{INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS * 10} minutes)</li>
                  <li>Minimum <strong>{INSURANCE_CONFIG.MIN_CONFIRMATIONS} confirmations</strong> required</li>
                  <li>You must have an active insurance policy</li>
                </ul>
              </AlertDescription>
            </Alert>

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

            {claimResult && (
              <div className="space-y-2">
                <Label htmlFor="policyId" className="text-foreground">Policy ID</Label>
                <Input
                  id="policyId"
                  type="text"
                  placeholder="Enter your policy ID (e.g., 1, 2, 3...)"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value.trim())}
                  disabled={submitting}
                  className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                />
                <p className="text-xs text-yellow-500">
                  ⚠️ Don't have a policy? First purchase insurance from the Purchase page.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 relative z-10">
            <Button 
              type="submit" 
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10" 
              disabled={loading}
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
          </CardFooter>
        </form>
      </Card>

      {claimResult && (
        <Card className="mt-6 overflow-hidden rounded-2xl border border-white/20">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "rgba(231, 236, 235, 0.08)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold text-foreground">Delay Analysis Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* Eligibility Status */}
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

            {/* Delay Analysis Details */}
            <div className="space-y-3 rounded-xl border border-white/10 p-4 bg-white/5">
              <h4 className="font-medium text-foreground mb-3">Delay Analysis</h4>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Estimated Broadcast Height:</div>
                <div className="text-foreground font-mono">{claimResult.delayAnalysis.estimatedBroadcastHeight.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Confirmation Height:</div>
                <div className="text-foreground font-mono">{claimResult.delayAnalysis.confirmationHeight.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Delay:</div>
                <div className={`font-medium ${claimResult.delayAnalysis.isDelayed ? 'text-green-500' : 'text-red-500'}`}>
                  {claimResult.delayAnalysis.delayBlocks} blocks (~{claimResult.delayAnalysis.delayMinutes} min)
                  {claimResult.delayAnalysis.isDelayed ? ' ✓' : ` (need ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS}+)`}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Fee Rate:</div>
                <div className={`text-foreground ${claimResult.delayAnalysis.isLowFee ? 'text-yellow-500' : ''}`}>
                  {claimResult.delayAnalysis.feeRate.toFixed(2)} sat/vB
                  {claimResult.delayAnalysis.isLowFee && ' (low fee)'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Analysis Method:</div>
                <div className="text-xs text-muted-foreground">{claimResult.delayAnalysis.reason}</div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 rounded-xl border border-white/10 p-4 bg-white/5">
              <h4 className="font-medium text-foreground mb-3">Transaction Details</h4>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">TX ID:</div>
                <div className="truncate font-mono text-xs text-foreground flex items-center gap-2">
                  {claimResult.transactionHash.slice(0, 16)}...
                  <a 
                    href={`https://www.blockchain.com/explorer/transactions/btc/${claimResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Confirmations:</div>
                <div className={`text-foreground ${claimResult.confirmations >= INSURANCE_CONFIG.MIN_CONFIRMATIONS ? 'text-green-500' : 'text-red-500'}`}>
                  {claimResult.confirmations.toLocaleString()}
                  {claimResult.confirmations >= INSURANCE_CONFIG.MIN_CONFIRMATIONS ? ' ✓' : ` (need ${INSURANCE_CONFIG.MIN_CONFIRMATIONS}+)`}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Fee:</div>
                <div className="text-foreground">{claimResult.fee.toLocaleString()} sats</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Size:</div>
                <div className="text-foreground">{claimResult.txSize} vB</div>
              </div>
            </div>

            {claimResult.isEligible && (
              <Button 
                onClick={handleSubmitClaim}
                disabled={submitting || !isConnected || !policyId}
                className="w-full bg-green-600 text-white hover:bg-green-700 px-8 py-3 rounded-full font-medium text-base shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Claim...
                  </>
                ) : !isConnected ? (
                  "Connect Wallet to Submit"
                ) : !policyId ? (
                  "Enter Policy ID to Submit"
                ) : (
                  "Submit Insurance Claim"
                )}
              </Button>
            )}

            {!claimResult.isEligible && (
              <div className="text-center text-sm text-muted-foreground">
                <p>This transaction does not qualify for an insurance claim.</p>
                <p className="mt-1">Insurance covers transactions delayed by {INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS}+ blocks due to network congestion.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
