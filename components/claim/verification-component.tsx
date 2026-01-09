"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2, Clock, ExternalLink, Info, Search } from "lucide-react"
import Link from "next/link"

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

interface VerificationResult {
  transactionHash: string
  broadcastHeight: number
  inclusionHeight: number
  delayBlocks: number
  delayMinutes: number
  feeRate: number
  confirmations: number
  isEligible: boolean
  eligibilityReason: string
  fee: number
  txSize: number
}

const INSURANCE_CONFIG = {
  DELAY_THRESHOLD_BLOCKS: 35,
  EXPECTED_BLOCK_TIME: 10, // minutes per block
  LOW_FEE_THRESHOLD: 5, // sat/vB
}

export function TransactionVerification() {
  const [txid, setTxid] = useState("")
  const [broadcastHeight, setBroadcastHeight] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [txData, setTxData] = useState<TransactionData | null>(null)

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

  const estimateBroadcastHeight = (
    confirmationHeight: number,
    feeRate: number
  ): number => {
    // If low fee, estimate longer wait
    if (feeRate < INSURANCE_CONFIG.LOW_FEE_THRESHOLD) {
      const estimatedWaitBlocks = Math.max(
        INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS,
        Math.floor(50 / (feeRate + 0.1))
      )
      return confirmationHeight - estimatedWaitBlocks
    }
    // Normal/high fee - assume quick confirmation
    return confirmationHeight - 2
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
    setVerificationResult(null)
    
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
      const inclusionHeight = tx.status.block_height
      const confirmations = currentHeight - inclusionHeight + 1
      
      // Calculate broadcast height
      let broadcastHeightValue: number
      if (broadcastHeight && parseInt(broadcastHeight) > 0) {
        broadcastHeightValue = parseInt(broadcastHeight)
      } else {
        // Estimate from fee rate
        const vsize = tx.weight ? Math.ceil(tx.weight / 4) : tx.size
        const feeRate = vsize > 0 ? tx.fee / vsize : 0
        broadcastHeightValue = estimateBroadcastHeight(inclusionHeight, feeRate)
      }
      
      const delayBlocks = inclusionHeight - broadcastHeightValue
      const delayMinutes = delayBlocks * INSURANCE_CONFIG.EXPECTED_BLOCK_TIME
      const vsize = tx.weight ? Math.ceil(tx.weight / 4) : tx.size
      const feeRate = vsize > 0 ? tx.fee / vsize : 0
      
      // Check eligibility (using default threshold, actual threshold depends on user's policy)
      const isEligible = delayBlocks >= INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS
      const eligibilityReason = isEligible
        ? `Transaction delayed by ${delayBlocks} blocks (exceeds minimum threshold of ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} blocks)`
        : `Transaction delayed by ${delayBlocks} blocks (minimum ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} blocks required)`
      
      setVerificationResult({
        transactionHash: cleanTxid,
        broadcastHeight: broadcastHeightValue,
        inclusionHeight,
        delayBlocks,
        delayMinutes,
        feeRate,
        confirmations,
        isEligible,
        eligibilityReason,
        fee: tx.fee,
        txSize: tx.size,
      })
      
      if (isEligible) {
        toast.success("Transaction eligible for claim!", {
          description: `Delayed by ${delayBlocks} blocks (~${delayMinutes} minutes)`,
        })
      } else {
        toast.warning("Transaction may not qualify", {
          description: `Delay: ${delayBlocks} blocks (minimum ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS} required)`,
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

  return (
    <div className="w-full space-y-6">
      <Card className="glass border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Verify Transaction Delay</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Check if your Bitcoin transaction has been delayed enough to qualify for an insurance claim
        </CardDescription>
            </div>
          </div>
      </CardHeader>
        <form onSubmit={handleVerify}>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-2">
              <Label htmlFor="txid" className="text-foreground">Bitcoin Transaction ID</Label>
            <Input
                id="txid"
                placeholder="e.g., 819571907118de9fa875ea126c7b128fc1bc998d89aa4196d6ade11d1fc21461"
                value={txid}
                onChange={(e) => {
                  setTxid(e.target.value)
                  setVerificationResult(null)
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
                The block height when you broadcast the transaction. If not provided, we'll estimate based on fee rate.
            </p>
          </div>
          
            {verificationResult && (
              <Alert className={
                verificationResult.isEligible 
                  ? "border-green-500/50 bg-green-500/10" 
                  : "border-yellow-500/50 bg-yellow-500/10"
              }>
                  {verificationResult.isEligible ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                <AlertTitle className="text-foreground">
                    {verificationResult.isEligible
                    ? "✅ Potentially Eligible for Claim" 
                    : "⚠️ May Not Qualify"}
                  </AlertTitle>
                <AlertDescription className="text-muted-foreground mt-2">
                  {verificationResult.eligibilityReason}
                  {verificationResult.isEligible && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <Link href="/claim">
                        <Button variant="outline" size="sm" className="w-full">
                          Submit Claim
                        </Button>
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
          <div className="px-6 pb-6 relative z-10">
          <Button 
            type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Transaction...
              </>
            ) : (
              "Verify Transaction Delay"
            )}
          </Button>
          </div>
      </form>
    </Card>

      {verificationResult && (
        <Card className="glass border border-white/10 overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold text-foreground">Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-3 rounded-xl border border-white/10 p-5 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-lg text-foreground">Delay Analysis</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Broadcast Height</div>
                  <div className="text-foreground font-mono font-semibold">{verificationResult.broadcastHeight.toLocaleString()}</div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Inclusion Height</div>
                  <div className="text-foreground font-mono font-semibold">{verificationResult.inclusionHeight.toLocaleString()}</div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Delay</div>
                  <div className={`font-bold text-lg ${verificationResult.isEligible ? 'text-green-400' : 'text-yellow-400'}`}>
                    {verificationResult.delayBlocks} blocks (~{verificationResult.delayMinutes} minutes)
                    {verificationResult.isEligible ? ' ✓' : ` (need ${INSURANCE_CONFIG.DELAY_THRESHOLD_BLOCKS}+)`}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Fee Rate</div>
                  <div className="text-foreground font-semibold">
                    {verificationResult.feeRate.toFixed(2)} sat/vB
                    {verificationResult.feeRate < INSURANCE_CONFIG.LOW_FEE_THRESHOLD && (
                      <span className="ml-2 text-yellow-400 text-xs">(low fee)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 p-5 bg-gradient-to-br from-accent/5 via-accent/3 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-lg text-foreground">Transaction Details</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Transaction ID</div>
                  <div className="truncate font-mono text-xs text-foreground flex items-center gap-2">
                    {verificationResult.transactionHash.slice(0, 20)}...
                    <a 
                      href={`https://www.blockchain.com/explorer/transactions/btc/${verificationResult.transactionHash}`}
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
                  <div className="text-foreground font-semibold">{verificationResult.confirmations.toLocaleString()}</div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Fee</div>
                  <div className="text-foreground font-semibold">{verificationResult.fee.toLocaleString()} sats</div>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Size</div>
                  <div className="text-foreground font-semibold">{verificationResult.txSize} vB</div>
                </div>
              </div>
            </div>

            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-foreground">Next Steps</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                {verificationResult.isEligible ? (
                  <>
                    This transaction appears eligible for a claim. To submit a claim, you'll need:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>An active policy purchase</li>
                      <li>The transaction must meet your policy's specific delay threshold</li>
                    </ul>
                    <Link href="/claim">
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        Go to Claims Page
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    This transaction may not meet the minimum delay threshold. Note that actual eligibility depends on your specific policy's delay threshold. 
                    <Link href="/claim">
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        Check with Your Policy
                      </Button>
                    </Link>
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
