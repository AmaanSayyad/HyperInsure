"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { verifyTransactionDelay, getCurrentBlockHeight } from "@/lib/stacks-api"

export function TransactionVerification() {
  const [formData, setFormData] = useState({
    txHash: "",
    broadcastHeight: "",
    currentBlockHeight: ""
  })
  
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCurrentBlock, setLoadingCurrentBlock] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const fetchCurrentBlockHeight = async () => {
    setLoadingCurrentBlock(true)
    try {
      const height = await getCurrentBlockHeight()
      setFormData(prev => ({ ...prev, currentBlockHeight: height.toString() }))
      toast.success("Current block height fetched successfully")
    } catch (error) {
      console.error("Error fetching current block height:", error)
      toast.error("Failed to fetch current block height")
    } finally {
      setLoadingCurrentBlock(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.txHash || !formData.broadcastHeight || !formData.currentBlockHeight) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    setVerificationResult(null)
    
    try {
      // For demo purposes, we'll use a required delay of 35 blocks
      const requiredDelay = 35
      
      const result = await verifyTransactionDelay(
        formData.txHash,
        parseInt(formData.broadcastHeight),
        parseInt(formData.currentBlockHeight),
        requiredDelay
      )
      
      setVerificationResult(result)
      
      if (result.isEligible) {
        toast.success("Transaction delay verified! You are eligible for a claim.", {
          duration: 5000
        })
      } else {
        toast.error("Transaction delay insufficient for a claim", {
          duration: 5000
        })
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      toast.error("Failed to verify transaction delay", {
        description: error.message,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-white/20">
      {/* Background with blur effect */}
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
        <CardTitle className="text-foreground text-xl font-semibold">Verify Transaction Delay</CardTitle>
        <CardDescription className="text-muted-foreground">
          Check if your transaction has been delayed enough to qualify for an insurance claim
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="txHash" className="text-foreground">Transaction Hash</Label>
            <Input
              id="txHash"
              name="txHash"
              placeholder="Enter transaction hash (0x...)"
              value={formData.txHash}
              onChange={handleInputChange}
              disabled={loading}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="broadcastHeight" className="text-foreground">Broadcast Block Height</Label>
            <Input
              id="broadcastHeight"
              name="broadcastHeight"
              type="number"
              placeholder="Block height when transaction was broadcast"
              value={formData.broadcastHeight}
              onChange={handleInputChange}
              disabled={loading}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
            <p className="text-sm text-muted-foreground">
              The block height when your transaction was submitted
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="currentBlockHeight" className="text-foreground">Current Block Height</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchCurrentBlockHeight}
                disabled={loadingCurrentBlock}
                className="h-8 px-2 text-xs"
              >
                {loadingCurrentBlock ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Current Height"
                )}
              </Button>
            </div>
            <Input
              id="currentBlockHeight"
              name="currentBlockHeight"
              type="number"
              placeholder="Current block height"
              value={formData.currentBlockHeight}
              onChange={handleInputChange}
              disabled={loading || loadingCurrentBlock}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
            <p className="text-sm text-muted-foreground">
              The current block height or inclusion block height
            </p>
          </div>
          
          {verificationResult && (
            <div className="pt-4">
              <Alert variant={verificationResult.isEligible ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {verificationResult.isEligible ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {verificationResult.isEligible
                      ? "Eligible for Claim"
                      : "Not Eligible for Claim"}
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Block Delay: {verificationResult.blockDelay} blocks</span>
                    </div>
                    <div>Broadcast Height: {verificationResult.broadcastHeight}</div>
                    <div>Inclusion Height: {verificationResult.inclusionHeight}</div>
                    <div>Broadcast Time: {verificationResult.broadcastTime}</div>
                    <div>Inclusion Time: {verificationResult.inclusionTime}</div>
                    <div>Time Delay: ~{Math.round(verificationResult.timeDelay / 60)} minutes</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="relative z-10">
          <Button 
            type="submit" 
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10"
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
        </CardFooter>
      </form>
    </Card>
  )
}
