"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

export function PolicyCreator() {
  const [formData, setFormData] = useState({
    policyName: "",
    delayThreshold: 35,
    policyDescription: "",
    premiumPercentage: 100, // Default 1%
    protocolFee: 50, // Default 0.5%
    payoutPerIncident: 500, // Default 500 STX
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Here you would typically send the data to your backend
    console.log("Policy created:", formData)
    
    // Show success notification
    toast.success("Policy created successfully", {
      description: `Policy "${formData.policyName}" has been created with a delay threshold of ${formData.delayThreshold} blocks.`,
    })
    
    // Reset form
    setFormData({
      policyName: "",
      delayThreshold: 35,
      policyDescription: "",
      premiumPercentage: 100,
      protocolFee: 50,
      payoutPerIncident: 500,
    })
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
          <CardTitle className="text-2xl font-semibold text-foreground">Create New Insurance Policy</CardTitle>
          <CardDescription className="text-muted-foreground">
            Define parameters for a new transaction delay insurance policy
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="policyName" className="text-foreground">Policy Name</Label>
              <Input
                id="policyName"
                name="policyName"
                placeholder="e.g., Standard Transaction Delay Coverage"
                value={formData.policyName}
                onChange={handleInputChange}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="policyDescription" className="text-foreground">Policy Description</Label>
              <Textarea
                id="policyDescription"
                name="policyDescription"
                placeholder="Describe the coverage details and conditions"
                value={formData.policyDescription}
                onChange={handleInputChange}
                className="border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delayThreshold" className="text-foreground">
                Delay Threshold (blocks) - {formData.delayThreshold}
              </Label>
              <div className="pt-2">
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
              <p className="text-sm text-muted-foreground">
                Number of blocks before a transaction is considered delayed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="premiumPercentage" className="text-foreground">
                Premium Percentage (basis points) - {formData.premiumPercentage/100}%
              </Label>
              <div className="pt-2">
                <Slider
                  id="premiumPercentage"
                  min={10}
                  max={1000}
                  step={10}
                  defaultValue={[formData.premiumPercentage]}
                  onValueChange={(value) => handleSliderChange("premiumPercentage", value)}
                  className="py-2"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Premium as % of pool size (100 = 1%, 1000 = 10%)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="protocolFee" className="text-foreground">
                Protocol Fee (basis points) - {formData.protocolFee/100}%
              </Label>
              <div className="pt-2">
                <Slider
                  id="protocolFee"
                  min={10}
                  max={500}
                  step={10}
                  defaultValue={[formData.protocolFee]}
                  onValueChange={(value) => handleSliderChange("protocolFee", value)}
                  className="py-2"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Fees taken from deposits (100 = 1%, 1000 = 10%)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payoutPerIncident" className="text-foreground">
                Payout per Incident (STX) - {formData.payoutPerIncident} STX
              </Label>
              <div className="pt-2">
                <Slider
                  id="payoutPerIncident"
                  min={100}
                  max={10000}
                  step={100}
                  defaultValue={[formData.payoutPerIncident]}
                  onValueChange={(value) => handleSliderChange("payoutPerIncident", value)}
                  className="py-2"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Fixed amount paid out for each valid claim
              </p>
            </div>
          </CardContent>
          <CardFooter className="relative z-10">
            <Button 
              type="submit" 
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium text-base shadow-lg ring-1 ring-white/10"
            >
              Create Policy
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
