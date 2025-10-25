"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ClaimForm() {
  const [formData, setFormData] = useState({
    transactionHash: "",
    blockNumber: "",
  })
  const [loading, setLoading] = useState(false)
  const [claimResult, setClaimResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Reset claim result when inputs change
    setClaimResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.transactionHash || !formData.blockNumber) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    
    try {
      // Simulate API call to verify transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock verification logic
      const blockNumber = parseInt(formData.blockNumber)
      const mockDelay = Math.floor(Math.random() * 50) + 20 // Random delay between 20-70 blocks
      
      // Check if delay is sufficient for claim (35 blocks threshold)
      const isEligible = mockDelay >= 35
      
      setClaimResult({
        transactionHash: formData.transactionHash,
        blockSubmitted: blockNumber,
        blockIncluded: blockNumber + mockDelay,
        delayBlocks: mockDelay,
        isEligible,
        policyId: isEligible ? "POL-002" : null,
        payoutAmount: isEligible ? 1000 : 0,
      })
      
      if (isEligible) {
        toast.success("Claim eligible for payout!", {
          description: `Your transaction was delayed by ${mockDelay} blocks, which exceeds the threshold.`,
        })
      } else {
        toast.error("Claim not eligible", {
          description: `Your transaction was delayed by ${mockDelay} blocks, which is below the required threshold of 35 blocks.`,
        })
      }
    } catch (error) {
      console.error("Error processing claim:", error)
      toast.error("Failed to process claim", {
        description: "There was an error verifying your transaction. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-2xl border border-white/20">
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
          <CardTitle className="text-2xl font-semibold text-foreground">Submit Insurance Claim</CardTitle>
          <CardDescription className="text-muted-foreground">
            Provide your transaction details to verify delay and process your claim
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="transactionHash" className="text-foreground">Transaction Hash</Label>
              <Input
                id="transactionHash"
                name="transactionHash"
                placeholder="e.g., 0x1234..."
                value={formData.transactionHash}
                onChange={handleInputChange}
                disabled={loading}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
              <p className="text-sm text-muted-foreground">
                The hash of the transaction you want to claim insurance for
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blockNumber" className="text-foreground">Block Number</Label>
              <Input
                id="blockNumber"
                name="blockNumber"
                type="number"
                placeholder="e.g., 123456"
                value={formData.blockNumber}
                onChange={handleInputChange}
                disabled={loading}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
              <p className="text-sm text-muted-foreground">
                The block number when the transaction was submitted
              </p>
            </div>
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
                  Verifying Delay...
                </>
              ) : (
                "Get Delay Proof"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {claimResult && (
        <Card className="mt-6 overflow-hidden rounded-2xl border border-white/20">
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
            <CardTitle className="text-xl font-semibold text-foreground">Claim Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {claimResult.isEligible ? (
              <Alert className="border-primary/50 bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-foreground">Claim Eligible!</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Your transaction was delayed by {claimResult.delayBlocks} blocks, which exceeds our threshold of 35 blocks.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-foreground">Claim Not Eligible</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Your transaction was delayed by {claimResult.delayBlocks} blocks, which is below our required threshold of 35 blocks.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 rounded-xl border border-white/10 p-4 bg-white/5">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium text-muted-foreground">Transaction Hash:</div>
                <div className="truncate font-mono text-xs text-foreground">{claimResult.transactionHash}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium text-muted-foreground">Block Submitted:</div>
                <div className="text-foreground">{claimResult.blockSubmitted}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium text-muted-foreground">Block Included:</div>
                <div className="text-foreground">{claimResult.blockIncluded}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium text-muted-foreground">Delay (blocks):</div>
                <div className="text-foreground">{claimResult.delayBlocks}</div>
              </div>
              {claimResult.isEligible && (
                <>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Policy ID:</div>
                    <div className="text-foreground">{claimResult.policyId}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Payout Amount:</div>
                    <div className="font-bold text-foreground">{claimResult.payoutAmount} STX</div>
                  </div>
                </>
              )}
            </div>

            {claimResult.isEligible && (
              <Button 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10"
              >
                Process Payout
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
