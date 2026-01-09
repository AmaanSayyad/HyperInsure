"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useStacks } from "@/lib/stacks-provider"
import { openContractCall } from "@stacks/connect"
import { AnchorMode, PostConditionMode, principal } from "@stacks/transactions"
import { CONTRACT_ADDRESSES, parseContractId, APP_CONFIG } from "@/lib/stacks-config"
import { ContractInteractions } from "@/lib/contract-utils"
import { Shield, UserCheck, AlertTriangle, Copy, ExternalLink, LogIn, Key } from "lucide-react"

export function AdminManager() {
  const { isConnected, userSession, network } = useStacks()
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null)
  const [newAdminAddress, setNewAdminAddress] = useState("ST2RAYW3DR2TPWC0QFY4FSSR7T2EDG6CMX8FZGGVD")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false)
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)

  // Get current admin address
  useEffect(() => {
    const fetchAdmin = async () => {
      if (!network) {
        console.warn("Network not initialized")
        return
      }
      
      setIsCheckingAdmin(true)
      try {
        const contractInteractions = new ContractInteractions(network, null)
        const admin = await contractInteractions.getAdminV2()
        
        if (admin) {
          setCurrentAdmin(admin)
          console.log("Admin address fetched successfully:", admin)
          
          // Check if current user is admin
          if (userSession?.isUserSignedIn()) {
            const userData = userSession.loadUserData()
            const userAddress = userData.profile?.stxAddress?.testnet || userData.profile?.stxAddress?.mainnet
            const isAdmin = userAddress === admin
            setIsCurrentUserAdmin(isAdmin)
            console.log("User is admin:", isAdmin, "User address:", userAddress)
          }
        } else {
          console.warn("Admin address is null - contract may not be deployed or function doesn't exist")
          setCurrentAdmin(null)
        }
      } catch (error: any) {
        console.error("Error fetching admin:", error)
        console.error("Error details:", {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        })
        setCurrentAdmin(null)
        // Don't show toast for initial load, only for user actions
      } finally {
        setIsCheckingAdmin(false)
      }
    }

    fetchAdmin()
  }, [network, userSession])

  const handleSetAdmin = async () => {
    if (!isConnected || !userSession) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!newAdminAddress.trim()) {
      toast.error("Please enter a valid Stacks address")
      return
    }

    // Validate Stacks address format
    if (!newAdminAddress.startsWith("ST") && !newAdminAddress.startsWith("SP")) {
      toast.error("Invalid Stacks address format. Must start with ST or SP")
      return
    }

    if (!network) {
      toast.error("Network not initialized")
      return
    }

    setIsLoading(true)

    try {
      // Verify current user is admin
      const contractInteractions = new ContractInteractions(network, userSession || null)
      const adminAddress = await contractInteractions.getAdminV2()
      const userAddress = userSession?.loadUserData()?.profile?.stxAddress?.testnet || userSession?.loadUserData()?.profile?.stxAddress?.mainnet
      
      if (userAddress !== adminAddress) {
        toast.error("Unauthorized", {
          description: `Only the current admin (${adminAddress?.slice(0, 6)}...${adminAddress?.slice(-4)}) can change the admin address.`,
          duration: 10000,
        })
        setIsLoading(false)
        return
      }

      const contractAddress = CONTRACT_ADDRESSES.HYPERINSURE_CORE_V2 || CONTRACT_ADDRESSES.HYPERINSURE_CORE
      if (!contractAddress) {
        toast.error("Contract address not configured")
        setIsLoading(false)
        return
      }

      const { address, name } = parseContractId(contractAddress)

      await openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: 'set-admin',
        functionArgs: [
          principal(newAdminAddress.trim()),
        ],
        network: {
          url: APP_CONFIG.STACKS_API_URL,
          chainId: APP_CONFIG.NETWORK === 'mainnet' ? 1 : 0x80000000,
        } as any,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          const explorerUrl = `${APP_CONFIG.EXPLORER_URL}/txid/${data.txId}?chain=${APP_CONFIG.NETWORK}`
          const copyTxId = () => {
            navigator.clipboard.writeText(data.txId)
            toast.success("Copied to clipboard!", { duration: 2000 })
          }
          
          toast.custom(
            (t) => (
              <div className={`glass rounded-2xl p-6 border border-white/10 shadow-2xl min-w-[420px] max-w-[500px] transition-all duration-300 ${t.visible ? 'animate-in slide-in-from-top-5' : 'animate-out slide-out-to-top-5'}`}>
                <div className="flex flex-col gap-5">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 via-primary/20 to-accent/20 border border-accent/40 flex items-center justify-center shadow-lg shadow-accent/20">
                      <Key className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-lg font-bold text-foreground mb-1.5">
                        Admin Address Updated!
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Admin changed to {newAdminAddress.slice(0, 8)}...{newAdminAddress.slice(-6)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction ID Section */}
                  <div className="glass rounded-xl p-4 border border-white/10 bg-gradient-to-br from-accent/5 via-accent/3 to-transparent">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Transaction ID
                      </div>
                      <button
                        onClick={copyTxId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent/40 transition-all text-xs font-medium text-foreground hover:text-accent active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-white/5 backdrop-blur-sm">
                      <code className="text-xs font-mono text-foreground/90 break-all flex-1 leading-relaxed">
                        {data.txId}
                      </code>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => {
                      window.open(explorerUrl, '_blank')
                      toast.dismiss(t.id)
                    }}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-accent/20 via-accent/15 to-accent/10 hover:from-accent/30 hover:via-accent/20 hover:to-accent/15 border border-accent/40 hover:border-accent/60 transition-all text-sm font-semibold text-accent hover:text-accent/90 group shadow-lg shadow-accent/10 hover:shadow-accent/20 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    View on Explorer
                  </button>
                </div>
              </div>
            ),
            {
              duration: 12000,
            }
          )
          // Refresh admin address
          setTimeout(() => {
            const contractInteractions = new ContractInteractions(network, null)
            contractInteractions.getAdminV2().then(setCurrentAdmin)
          }, 3000)
          setIsLoading(false)
        },
        onCancel: () => {
          toast.info("Transaction cancelled")
          setIsLoading(false)
        },
      })
    } catch (error: any) {
      console.error('Error setting admin:', error)
      toast.error("Failed to update admin address", {
        description: error?.message || "An unexpected error occurred.",
        duration: 8000,
      })
      setIsLoading(false)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Address copied to clipboard")
  }

  return (
    <Card className="glass border border-white/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Admin Management</CardTitle>
            <CardDescription>Change the contract admin address</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Admin Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Current Admin Address</Label>
          {isCheckingAdmin ? (
            <div className="flex items-center gap-2 p-4 rounded-lg glass border border-white/10">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading admin address...</span>
            </div>
          ) : currentAdmin ? (
            <div className="flex items-center gap-3 p-4 rounded-lg glass border border-white/10 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
              <code className="flex-1 text-sm font-mono text-foreground break-all">
                {currentAdmin}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyAddress(currentAdmin)}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-lg glass border border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400 mb-1">Unable to fetch admin address</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    This could be due to: contract not deployed, network connection issues, or the get-admin function not being available.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (network) {
                        setIsCheckingAdmin(true)
                        try {
                          const contractInteractions = new ContractInteractions(network, null)
                          const admin = await contractInteractions.getAdminV2()
                          setCurrentAdmin(admin)
                          if (admin) {
                            toast.success("Admin address fetched successfully")
                          } else {
                            toast.error("Admin address not found. Check contract deployment.")
                          }
                        } catch (error) {
                          console.error("Retry error:", error)
                          toast.error("Failed to fetch admin address. Check console for details.")
                        } finally {
                          setIsCheckingAdmin(false)
                        }
                      }
                    }}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current User Status */}
        {isCurrentUserAdmin && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <UserCheck className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              You are the current admin and can change the admin address
            </span>
          </div>
        )}

        {!isCurrentUserAdmin && currentAdmin && (
          <div className="p-4 rounded-lg glass border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-yellow-400">
                  You are not the current admin
                </p>
                <p className="text-xs text-muted-foreground">
                  To change the admin address, you need to connect with the current admin wallet. 
                  <span className="text-yellow-400 font-medium"> Note: Changing the .env file will NOT update the on-chain admin address.</span>
                </p>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-white/10">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">
                    {currentAdmin}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(currentAdmin)}
                    className="flex-shrink-0 h-7 px-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <LogIn className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-muted-foreground">
                    Disconnect your current wallet and connect with the admin wallet above to proceed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set New Admin */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="space-y-2">
            <Label htmlFor="newAdmin" className="text-sm font-medium">
              New Admin Address
            </Label>
            <Input
              id="newAdmin"
              type="text"
              placeholder="ST2RAYW3DR2TPWC0QFY4FSSR7T2EDG6CMX8FZGGVD"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              className="font-mono text-sm"
              disabled={!isCurrentUserAdmin || isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the Stacks address (ST or SP) that will become the new admin
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-yellow-400">Important Warning</p>
                <p className="text-muted-foreground">
                  Changing the admin address will transfer all administrative privileges to the new address. 
                  The current admin will lose access. Make sure you trust the new address and have access to it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {!isCurrentUserAdmin && currentAdmin && (
          <div className="w-full p-3 rounded-lg glass border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 justify-center">
              <LogIn className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-yellow-400 text-center">
                Connect with the current admin wallet to enable this button
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Current admin: <code className="text-foreground">{currentAdmin.slice(0, 8)}...{currentAdmin.slice(-6)}</code>
            </p>
          </div>
        )}
        <Button
          onClick={handleSetAdmin}
          disabled={!isCurrentUserAdmin || isLoading || !newAdminAddress.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Updating Admin..." : "Update Admin Address"}
        </Button>
      </CardFooter>
    </Card>
  )
}
