"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Search, 
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Crown,
  ExternalLink,
  Copy,
  Eye,
  Loader2,
  FileText
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useStacks } from "@/lib/stacks-provider"
import { ContractInteractions } from "@/lib/contract-utils"
import { formatSTX } from "@/lib/contract-utils"
import Link from "next/link"
import { APP_CONFIG } from "@/lib/stacks-config"

// Known policy IDs to fetch from contract - try common patterns
const KNOWN_POLICY_IDS = [
  "POL-001", "POL-002", "POL-003",
  "policy-1", "policy-2", "policy-3",
  "POL1", "POL2", "POL3",
  "starter", "professional", "enterprise",
  "STARTER", "PROFESSIONAL", "ENTERPRISE"
]

// Get policy IDs from localStorage (tracked when created)
function getTrackedPolicyIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('hyperinsure_created_policies')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Policy metadata (for display purposes)
const POLICY_METADATA: Record<string, { icon: any; popular: boolean }> = {
  "POL-001": { icon: Zap, popular: false },
  "POL-002": { icon: Sparkles, popular: true },
  "POL-003": { icon: Crown, popular: false },
}

interface AvailablePolicy {
  id: string
  name: string
  description: string
  delayThreshold: number
  premiumRate: number
  protocolFee: number
  payoutPerIncident: number
  icon: any
  popular: boolean
  active: boolean
}

interface UserPurchase {
  purchaseId: string
  policyId: string
  policyName: string
  coverageAmount: number
  premiumPaid: number
  protocolFee: number
  purchaseDate: Date
  expiryDate: Date
  status: "active" | "expired"
  delayThreshold: number
  payoutPerIncident: number
}

export function PoliciesDashboard() {
  const { isConnected, userAddress, userSession, network } = useStacks()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all")
  const [availablePolicies, setAvailablePolicies] = useState<AvailablePolicy[]>([])
  const [userPolicies, setUserPolicies] = useState<UserPurchase[]>([])
  const [stats, setStats] = useState({
    activePolicies: 0,
    totalCoverage: 0,
    totalPremiumsPaid: 0,
    totalClaims: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [contractInteractions, setContractInteractions] = useState<ContractInteractions | null>(null)

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

  // Fetch available policies from contract
  useEffect(() => {
    const fetchAvailablePolicies = async () => {
      if (!contractInteractions || !network) {
        console.log("No contract interactions or network available")
        return
      }

      setIsLoading(true)
      try {
        const policies: AvailablePolicy[] = []
        console.log("Fetching available policies from contract...")

        // Combine known policy IDs with tracked ones
        const trackedIds = getTrackedPolicyIds()
        const allPolicyIds = [...new Set([...KNOWN_POLICY_IDS, ...trackedIds])]
        console.log(`Checking ${allPolicyIds.length} policy IDs:`, allPolicyIds)

        for (const policyId of allPolicyIds) {
          try {
            const policyData = await contractInteractions.getPolicyV2(policyId)
            if (policyData) {
              const metadata = POLICY_METADATA[policyId] || { icon: Shield, popular: false }
              
              // Handle different response structures
              const name = policyData.name?.value || policyData.name || policyId
              const description = policyData.description?.value || policyData.description || "Insurance policy"
              const delayThreshold = parseInt(
                policyData["delay-threshold"]?.value?.toString() || 
                policyData["delay-threshold"]?.toString() || 
                "35"
              )
              const premiumPercentage = parseInt(
                policyData["premium-percentage"]?.value?.toString() || 
                policyData["premium-percentage"]?.toString() || 
                "200"
              )
              const protocolFee = parseInt(
                policyData["protocol-fee"]?.value?.toString() || 
                policyData["protocol-fee"]?.toString() || 
                "100"
              )
              const payoutPerIncident = parseInt(
                policyData["payout-per-incident"]?.value?.toString() || 
                policyData["payout-per-incident"]?.toString() || 
                "500"
              )
              const active = policyData.active?.value === true || policyData.active === true
              
              policies.push({
                id: policyId,
                name: typeof name === 'string' ? name : policyId,
                description: typeof description === 'string' ? description : "Insurance policy",
                delayThreshold,
                premiumRate: parseFloat((premiumPercentage / 100).toFixed(2)),
                protocolFee: parseFloat((protocolFee / 100).toFixed(2)),
                payoutPerIncident,
                icon: metadata.icon,
                popular: metadata.popular,
                active,
              })
            } else {
              console.log(`Policy ${policyId} not found in contract`)
            }
          } catch (error: any) {
            // Handle network errors gracefully
            if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
              console.warn(`Network error fetching policy ${policyId}, skipping...`)
            } else {
              console.error(`Error fetching policy ${policyId}:`, error)
            }
          }
        }

        console.log(`Fetched ${policies.length} policies:`, policies)
        setAvailablePolicies(policies)
      } catch (error: any) {
        console.error("Error fetching available policies:", error)
        // If it's a network error, show a helpful message but don't break UI
        if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
          console.warn("Network error - policies may not be available. Check your connection.")
        }
        // Show error but don't block UI
        setAvailablePolicies([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailablePolicies()
  }, [contractInteractions])

  // Fetch user purchases
  useEffect(() => {
    const fetchUserPolicies = async () => {
      if (!isConnected || !userAddress || !contractInteractions || !network) {
        setUserPolicies([])
        return
      }

      try {
        // Get purchase IDs from localStorage (tracked when purchases are made)
        const storageKey = `hyperinsure_purchases_${userAddress}`
        const storedPurchases = localStorage.getItem(storageKey)
        const purchaseIds: string[] = storedPurchases ? JSON.parse(storedPurchases) : []
        
        console.log(`Found ${purchaseIds.length} purchase IDs for user ${userAddress}:`, purchaseIds)

        const purchases: UserPurchase[] = []

        for (const purchaseId of purchaseIds) {
          try {
            const purchaseData = await contractInteractions.getPurchaseV2(purchaseId)
            if (purchaseData && purchaseData !== null) {
              // Handle different response structures
              const purchaser = purchaseData.purchaser?.value || purchaseData.purchaser
              if (purchaser === userAddress) {
                const policyId = purchaseData["policy-id"]?.value || purchaseData["policy-id"] || ""
                const policyData = await contractInteractions.getPolicyV2(policyId)
                
                if (policyData) {
                  const createdAt = parseInt(
                    purchaseData["created-at"]?.value?.toString() || 
                    purchaseData["created-at"]?.toString() || 
                    "0"
                  )
                  const expiry = parseInt(
                    purchaseData.expiry?.value?.toString() || 
                    purchaseData.expiry?.toString() || 
                    "0"
                  )
                  
                  // Convert block height to approximate date (assuming ~10 min per block)
                  const blocksToMs = 600000 // 10 minutes per block
                  const purchaseDate = new Date(Date.now() - (createdAt * blocksToMs))
                  const expiryDate = expiry > 0 ? new Date(Date.now() - (expiry * blocksToMs)) : new Date()
                  const isExpired = expiry > 0 && Date.now() > expiryDate.getTime()

                  const stxAmount = parseInt(
                    purchaseData["stx-amount"]?.value?.toString() || 
                    purchaseData["stx-amount"]?.toString() || 
                    "0"
                  )
                  const premiumPaid = parseInt(
                    purchaseData["premium-paid"]?.value?.toString() || 
                    purchaseData["premium-paid"]?.toString() || 
                    "0"
                  )
                  const feePaid = parseInt(
                    purchaseData["fee-paid"]?.value?.toString() || 
                    purchaseData["fee-paid"]?.toString() || 
                    "0"
                  )

                  const policyName = policyData.name?.value || policyData.name || "Unknown"
                  const delayThreshold = parseInt(
                    policyData["delay-threshold"]?.value?.toString() || 
                    policyData["delay-threshold"]?.toString() || 
                    "35"
                  )
                  const payoutPerIncident = parseInt(
                    policyData["payout-per-incident"]?.value?.toString() || 
                    policyData["payout-per-incident"]?.toString() || 
                    "500"
                  )

                  purchases.push({
                    purchaseId,
                    policyId,
                    policyName: typeof policyName === 'string' ? policyName : "Unknown",
                    coverageAmount: stxAmount / 1000000,
                    premiumPaid: premiumPaid / 1000000,
                    protocolFee: feePaid / 1000000,
                    purchaseDate,
                    expiryDate,
                    status: isExpired ? "expired" : "active",
                    delayThreshold,
                    payoutPerIncident,
                  })
                }
              }
            }
          } catch (error: any) {
            // Handle network errors gracefully - don't break the whole flow
            if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
              console.warn(`Network error fetching purchase ${purchaseId}, skipping...`)
              // Continue with other purchases
            } else {
              console.error(`Error fetching purchase ${purchaseId}:`, error)
            }
          }
        }

        console.log(`Fetched ${purchases.length} user purchases:`, purchases)
        setUserPolicies(purchases)

        // Calculate statistics
        const activePolicies = purchases.filter(p => p.status === "active")
        setStats({
          activePolicies: activePolicies.length,
          totalCoverage: purchases.reduce((sum, p) => sum + p.coverageAmount, 0),
          totalPremiumsPaid: purchases.reduce((sum, p) => sum + p.premiumPaid, 0),
          totalClaims: 0, // TODO: Fetch from claims contract
        })
      } catch (error: any) {
        console.error("Error fetching user policies:", error)
        // Handle network errors gracefully
        if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
          console.warn("Network error - user policies may not be available. Check your connection.")
        }
        setUserPolicies([])
      }
    }

    fetchUserPolicies()
  }, [isConnected, userAddress, contractInteractions])

  // Filter user policies
  const filteredUserPolicies = userPolicies.filter((policy) => {
    const matchesSearch = 
      policy.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.purchaseId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = 
      filterStatus === "all" || policy.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border border-white/10 hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Policies</p>
                <p className="text-3xl font-bold text-foreground">{stats.activePolicies}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-white/10 hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Coverage</p>
                <p className="text-3xl font-bold text-foreground">{formatSTX(stats.totalCoverage * 1000000)}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-white/10 hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Premiums Paid</p>
                <p className="text-3xl font-bold text-foreground">{formatSTX(stats.totalPremiumsPaid * 1000000)}</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-white/10 hover:border-primary/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Claims</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalClaims}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Moved to top for better UX */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass border border-white/10 hover:border-primary/30 transition-all cursor-pointer group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Link href="/purchase">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 group-hover:from-primary/30 group-hover:via-primary/20 group-hover:to-primary/15 transition-all shadow-lg shadow-primary/10 group-hover:shadow-primary/20">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1.5 group-hover:text-primary transition-colors">Purchase Policy</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get coverage for your transactions
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="glass border border-white/10 hover:border-secondary/30 transition-all cursor-pointer group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Link href="/claim">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/15 to-secondary/10 group-hover:from-secondary/30 group-hover:via-secondary/20 group-hover:to-secondary/15 transition-all shadow-lg shadow-secondary/10 group-hover:shadow-secondary/20">
                  <Shield className="w-7 h-7 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1.5 group-hover:text-secondary transition-colors">Submit Claim</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    File a claim for delayed transactions
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-secondary group-hover:translate-x-2 transition-all" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="glass border border-white/10 hover:border-accent/30 transition-all cursor-pointer group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Link href="/verify">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 group-hover:from-accent/30 group-hover:via-accent/20 group-hover:to-accent/15 transition-all shadow-lg shadow-accent/10 group-hover:shadow-accent/20">
                  <CheckCircle2 className="w-7 h-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1.5 group-hover:text-accent transition-colors">Verify Transaction</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Check transaction delay status
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-accent group-hover:translate-x-2 transition-all" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Available Policies Section */}
      <Card className="glass border border-white/10 overflow-hidden">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground mb-2">
                Available Policies
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose from insurance plans created by administrators
              </CardDescription>
            </div>
            <Link href="/purchase">
              <Button className="gap-2">
                Purchase Policy
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : availablePolicies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No policies available</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {availablePolicies.map((policy) => {
              const Icon = policy.icon
              return (
                <div
                  key={policy.id}
                  className="glass rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-all hover:scale-[1.02] relative overflow-hidden group"
                >
                  {policy.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{policy.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                    {policy.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Premium Rate</span>
                      <span className="font-semibold text-foreground">{policy.premiumRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delay Threshold</span>
                      <span className="font-semibold text-foreground">{policy.delayThreshold} blocks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Protocol Fee</span>
                      <span className="font-semibold text-foreground">{policy.protocolFee}%</span>
                    </div>
                  </div>
                  <Link href="/purchase" className="block">
                    <Button className="w-full gap-2" variant="outline">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Active Policies Section */}
      <Card className="glass border border-white/10 overflow-hidden">
        <CardHeader className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground mb-2">
                My Policies
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isConnected 
                  ? "Manage and monitor your active insurance coverage"
                  : "Connect your wallet to view your policies"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "expired" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("expired")}
                >
                  Expired
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {!isConnected ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your Stacks wallet to view and manage your insurance policies
              </p>
              <Link href="/purchase">
                <Button className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : filteredUserPolicies.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/10 mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Policies Found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "You don't have any policies yet. Purchase one to get started!"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Link href="/purchase">
                  <Button className="gap-2">
                    Purchase Policy
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white/5 border-white/10">
                    <TableHead className="text-foreground font-medium">Policy</TableHead>
                    <TableHead className="text-foreground font-medium">Coverage</TableHead>
                    <TableHead className="text-foreground font-medium">Premium Paid</TableHead>
                    <TableHead className="text-foreground font-medium">Purchase Date</TableHead>
                    <TableHead className="text-foreground font-medium">Expiry Date</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserPolicies.map((policy) => (
                    <TableRow key={policy.purchaseId} className="hover:bg-white/5 border-white/10">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-foreground">{policy.policyName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {policy.purchaseId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {formatSTX(policy.coverageAmount * 1000000)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {policy.delayThreshold} blocks threshold
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {formatSTX(policy.premiumPaid * 1000000)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          + {formatSTX(policy.protocolFee * 1000000)} fee
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(policy.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(policy.expiryDate)}
                      </TableCell>
                      <TableCell>
                        {policy.status === "active" ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-muted/20 text-muted-foreground border-muted/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(policy.purchaseId)}
                            title="Copy Purchase ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {policy.status === "active" && (
                            <Link href="/claim">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Submit Claim"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Expiration Warnings */}
      {isConnected && userPolicies.length > 0 && (
        <Card className="glass border border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-lg font-semibold text-yellow-400">
                Policy Expiration Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {userPolicies
              .filter(p => {
                const now = Date.now()
                const expiry = p.expiryDate.getTime()
                const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24)
                return p.status === "active" && daysUntilExpiry > 0 && daysUntilExpiry <= 7
              })
              .map(policy => {
                const daysUntilExpiry = Math.ceil((policy.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={policy.purchaseId} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{policy.policyName}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <Link href="/purchase">
                      <Button size="sm" variant="outline" className="text-xs">
                        Renew
                      </Button>
                    </Link>
                  </div>
                )
              })}
            {userPolicies.filter(p => {
              const now = Date.now()
              const expiry = p.expiryDate.getTime()
              const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24)
              return p.status === "active" && daysUntilExpiry > 0 && daysUntilExpiry <= 7
            }).length === 0 && (
              <p className="text-sm text-muted-foreground">No policies expiring soon</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help & Information Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                How Policies Work
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-foreground mb-1">Purchase Coverage</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Select a policy and pay the premium using STX tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-foreground mb-1">Policy Active</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Your coverage is active for the specified duration (typically 1,008 blocks ~7 days)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-foreground mb-1">Submit Claim</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">If your Bitcoin transaction is delayed beyond the threshold, submit a claim with transaction details</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/10">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-foreground mb-1">Automatic Payout</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Verified claims are automatically paid from the treasury</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 border border-accent/20">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Policy Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Coverage Duration
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">Policies are active for 1,008 blocks (~7 days) from purchase date</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  Delay Threshold
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">Claims are eligible when Bitcoin transaction delay exceeds the policy's block threshold</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" />
                  Premium & Fees
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">Premium rate varies by policy. Protocol fee is additional and goes to treasury maintenance</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Payout Amount
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">Each policy specifies a payout per incident, paid in STX tokens</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <Link href="/claim">
                <Button variant="outline" className="w-full group" size="sm">
                  Learn About Claims
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
