"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function DelayedTransactionClaim() {
  const [formData, setFormData] = useState({
    transferAmount: "",
    walletAddress: "",
    claimAmount: "",
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.transferAmount || !formData.walletAddress || !formData.claimAmount) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    
    try {
      // Simulate API call to process claim
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success notification
      toast.success("Claim submitted successfully", {
        description: `Your claim for ${formData.claimAmount} STX has been submitted and is being processed.`,
        duration: 5000,
      })
      
      // Reset form
      setFormData({
        transferAmount: "",
        walletAddress: "",
        claimAmount: "",
      })
    } catch (error) {
      console.error("Error processing claim:", error)
      toast.error("Failed to submit claim", {
        description: "There was an error processing your claim. Please try again.",
        duration: 5000,
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
        <CardTitle className="text-foreground text-xl font-semibold">Claim Insurance for Delayed Transaction</CardTitle>
        <CardDescription className="text-muted-foreground">
          Submit your claim for a delayed transaction
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="transferAmount" className="text-foreground">Transfer Amount (STX)</Label>
            <Input
              id="transferAmount"
              name="transferAmount"
              type="number"
              placeholder="Enter original transfer amount"
              value={formData.transferAmount}
              onChange={handleInputChange}
              disabled={loading}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
            <p className="text-sm text-muted-foreground">
              The original amount of STX you were transferring
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="walletAddress" className="text-foreground">Wallet Address</Label>
            <Input
              id="walletAddress"
              name="walletAddress"
              placeholder="Enter your STX wallet address"
              value={formData.walletAddress}
              onChange={handleInputChange}
              disabled={loading}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
            <p className="text-sm text-muted-foreground">
              The wallet address where you want to receive the claim payout
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="claimAmount" className="text-foreground">Claim Amount (STX)</Label>
            <Input
              id="claimAmount"
              name="claimAmount"
              type="number"
              placeholder="Enter claim amount"
              value={formData.claimAmount}
              onChange={handleInputChange}
              disabled={loading}
              className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
              required
            />
            <p className="text-sm text-muted-foreground">
              The amount of STX you are claiming as compensation
            </p>
          </div>
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
                Processing Claim...
              </>
            ) : (
              "Claim Insurance"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
