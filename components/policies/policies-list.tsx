"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

// Mock data for policies
const mockPolicies = [
  {
    id: "POL-001",
    name: "Standard Transaction Delay Coverage",
    description: "Covers transactions delayed by more than 35 blocks with standard payout.",
    dateCreated: new Date("2025-08-15"),
    contractAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
    delayThreshold: 35,
    premiumPercentage: 200, // 2%
    protocolFee: 100, // 1%
    payoutPerIncident: 500, // 500 STX
  },
  {
    id: "POL-002",
    name: "Premium Delay Protection",
    description: "Enhanced coverage for high-value transactions with higher payouts.",
    dateCreated: new Date("2025-08-20"),
    contractAddress: "SP1Z1HQ5JKPGHM0RW5X5VXDH7TY8K4TVFR8ZETXNZ",
    delayThreshold: 30,
    premiumPercentage: 300, // 3%
    protocolFee: 150, // 1.5%
    payoutPerIncident: 1000, // 1000 STX
  },
  {
    id: "POL-003",
    name: "Cross-Chain Delay Insurance",
    description: "Coverage for transactions across multiple blockchains with extended protection.",
    dateCreated: new Date("2025-09-01"),
    contractAddress: "SP3QSAJQ4EA8WXEDSRRKMZZ29NH91VZ6C5X88FGZQ",
    delayThreshold: 40,
    premiumPercentage: 250, // 2.5%
    protocolFee: 120, // 1.2%
    payoutPerIncident: 750, // 750 STX
  },
]

export function PoliciesList() {
  const [policies, setPolicies] = useState(mockPolicies)

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
          <CardTitle className="text-2xl font-semibold text-foreground">Available Insurance Policies</CardTitle>
          <CardDescription className="text-muted-foreground">
            All active policies created by administrators for transaction delay protection
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-white/5">
                  <TableHead className="text-foreground font-medium">Policy ID</TableHead>
                  <TableHead className="text-foreground font-medium">Policy Name</TableHead>
                  <TableHead className="text-foreground font-medium">Description</TableHead>
                  <TableHead className="text-foreground font-medium">Date Created</TableHead>
                  <TableHead className="text-foreground font-medium">Contract Address</TableHead>
                  <TableHead className="text-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id} className="hover:bg-white/5 border-white/10">
                    <TableCell className="font-medium text-foreground">{policy.id}</TableCell>
                    <TableCell className="text-foreground">{policy.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{policy.description}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(policy.dateCreated)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="truncate max-w-[120px]" title={policy.contractAddress}>
                        {policy.contractAddress}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-medium shadow-sm px-4 py-1"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
