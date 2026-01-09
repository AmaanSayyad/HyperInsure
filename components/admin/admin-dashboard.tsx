"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useStacks } from "@/lib/stacks-provider"
import { ContractInteractions } from "@/lib/contract-utils"
import { Shield, Users, TrendingUp, DollarSign, FileText, Activity, Wallet, AlertCircle, Loader2 } from "lucide-react"
import { formatSTX } from "@/lib/contract-utils"

interface AdminStats {
  policyCount: number
  purchaseCount: number
  totalDeposits: number
  totalPayouts: number
  contractBalance: number
  claimCount: number
}

export function AdminDashboard() {
  const { isConnected, network } = useStacks()
  const [stats, setStats] = useState<AdminStats>({
    policyCount: 0,
    purchaseCount: 0,
    totalDeposits: 0,
    totalPayouts: 0,
    contractBalance: 0,
    claimCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!network) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const contractInteractions = new ContractInteractions(network, null)
        
        // Fetch all stats in parallel with better error handling
        const [policyCount, purchaseCount, totalDeposits, totalPayouts, contractBalance] = await Promise.allSettled([
          contractInteractions.getPolicyCountV2(),
          contractInteractions.getPurchaseCountV2(),
          contractInteractions.getTotalDepositsV2(),
          contractInteractions.getTotalPayoutsV2(),
          contractInteractions.getTreasuryBalance(),
        ]).then(results => results.map(result => 
          result.status === 'fulfilled' ? result.value : 0
        ))

        // Convert STX values back to microSTX for display (formatSTX expects microSTX)
        const totalDepositsMicroSTX = totalDeposits * 1000000
        const totalPayoutsMicroSTX = totalPayouts * 1000000
        const contractBalanceMicroSTX = contractBalance * 1000000

        setStats({
          policyCount,
          purchaseCount,
          totalDeposits: totalDepositsMicroSTX,
          totalPayouts: totalPayoutsMicroSTX,
          contractBalance: contractBalanceMicroSTX,
          claimCount: 0, // TODO: Add claim count when available
        })
        setLastUpdated(new Date())
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [network])

  const statCards = [
    {
      title: "Total Policies",
      value: stats.policyCount,
      icon: Shield,
      color: "primary",
      description: "Active insurance policies",
      trend: null,
    },
    {
      title: "Total Purchases",
      value: stats.purchaseCount,
      icon: Users,
      color: "accent",
      description: "Policy purchases made",
      trend: null,
    },
    {
      title: "Total Deposits",
      value: formatSTX(stats.totalDeposits),
      icon: DollarSign,
      color: "secondary",
      description: "Total premiums collected",
      trend: null,
    },
    {
      title: "Total Payouts",
      value: formatSTX(stats.totalPayouts),
      icon: TrendingUp,
      color: "primary",
      description: "Claims paid out",
      trend: null,
    },
    {
      title: "Contract Balance",
      value: formatSTX(stats.contractBalance),
      icon: Wallet,
      color: "accent",
      description: "Current treasury balance",
      trend: null,
    },
    {
      title: "Net Revenue",
      value: formatSTX(stats.totalDeposits - stats.totalPayouts),
      icon: Activity,
      color: stats.totalDeposits > stats.totalPayouts ? "secondary" : "primary",
      description: "Deposits minus payouts",
      trend: stats.totalDeposits > stats.totalPayouts ? "positive" : "neutral",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      primary: "bg-primary/10 text-primary border-primary/20",
      accent: "bg-accent/10 text-accent border-accent/20",
      secondary: "bg-secondary/10 text-secondary border-secondary/20",
    }
    return colors[color as keyof typeof colors] || colors.primary
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">System Overview</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Real-time statistics and health metrics from the HyperInsure contract
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg glass border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="glass border border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Enhanced gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardContent className="p-5 md:p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${getColorClasses(stat.color)} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  {isLoading && (
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </span>
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">System Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Treasury Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reserve Ratio</span>
                <span className="text-sm font-medium text-foreground">
                  {stats.totalDeposits > 0
                    ? `${((stats.contractBalance / stats.totalDeposits) * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">Performance Metrics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Purchase Value</span>
                <span className="text-sm font-medium text-foreground">
                  {stats.purchaseCount > 0
                    ? formatSTX(stats.totalDeposits / stats.purchaseCount)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payout Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {stats.totalDeposits > 0
                    ? `${((stats.totalPayouts / stats.totalDeposits) * 100).toFixed(2)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profit Margin</span>
                <span className="text-sm font-medium text-green-400">
                  {stats.totalDeposits > 0
                    ? `${(((stats.totalDeposits - stats.totalPayouts) / stats.totalDeposits) * 100).toFixed(2)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isConnected && (
        <Card className="glass border border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Wallet Not Connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your wallet to view real-time statistics and manage the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
