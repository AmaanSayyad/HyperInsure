"use client"

import { useState } from "react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminManager } from "@/components/admin/admin-manager"
import { PolicyCreator } from "@/components/admin/policy-creator"
import { 
  Settings, 
  Shield, 
  Users, 
  FileText, 
  Key,
  LayoutDashboard,
  Sparkles,
  Activity
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESSES, APP_CONFIG } from "@/lib/stacks-config"

type TabType = "overview" | "policies" | "admin"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  const tabs = [
    {
      id: "overview" as TabType,
      label: "Overview",
      icon: LayoutDashboard,
      description: "System statistics and health"
    },
    {
      id: "policies" as TabType,
      label: "Policies",
      icon: Shield,
      description: "Create and manage policies"
    },
    {
      id: "admin" as TabType,
      label: "Admin Settings",
      icon: Key,
      description: "Manage admin access"
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[140px] opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-accent/12 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div className="space-y-4">
               
                <div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3">
                    <span className="block text-foreground">Admin</span>
                    <span className="block text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                      Dashboard
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                    Comprehensive control panel for managing HyperInsure policies, monitoring system health, and configuring administrative settings
                  </p>
                </div>
              </div>
              
              {/* Quick Stats Badge */}
              <div className="flex items-center gap-4">
                <Card className="glass border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">System Status</p>
                      <p className="text-sm font-semibold text-green-400">Operational</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 glass rounded-2xl border border-white/10 w-full overflow-x-auto relative z-20">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveTab(tab.id)
                    }}
                    className={`
                      relative flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer
                      ${isActive 
                        ? "bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 text-primary border border-primary/30 shadow-lg shadow-primary/10 z-10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <AdminDashboard />
                
                {/* Quick Actions */}
                <Card className="glass border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Quick Actions
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Frequently used administrative functions
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start gap-2 glass border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveTab("policies")
                        }}
                      >
                        <Shield className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Create Policy</p>
                          <p className="text-xs text-muted-foreground">Add new insurance policy</p>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start gap-2 glass border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveTab("admin")
                        }}
                      >
                        <Key className="w-5 h-5 text-accent" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">Manage Admin</p>
                          <p className="text-xs text-muted-foreground">Change admin address</p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Help & Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass border border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Admin Capabilities</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Shield className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Create Policies</p>
                            <p className="text-muted-foreground">Define new insurance policies with custom parameters</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Key className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Manage Access</p>
                            <p className="text-muted-foreground">Transfer admin privileges to another address</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Activity className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Monitor System</p>
                            <p className="text-muted-foreground">Track policies, purchases, deposits, and payouts</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass border border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Settings className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="font-semibold text-foreground">System Information</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground mb-1">Contract Address</p>
                          <p className="text-muted-foreground font-mono text-xs break-all">
                            {CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2 || "Not configured"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Network</p>
                          <p className="text-muted-foreground capitalize">
                            {APP_CONFIG.NETWORK || "testnet"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Admin Privileges</p>
                          <p className="text-muted-foreground">
                            Only the contract admin can create policies and manage system settings
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "policies" && (
              <div>
            <PolicyCreator />
              </div>
            )}

            {activeTab === "admin" && (
              <div>
                <AdminManager />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
