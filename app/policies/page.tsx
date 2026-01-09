import { PoliciesDashboard } from "@/components/policies/policies-dashboard"
import { Shield, FileText, TrendingUp } from "lucide-react"

export const metadata = {
  title: "Policies Dashboard | HyperInsure",
  description: "Manage your insurance policies and explore available coverage options",
}

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Elegant Blue Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16 space-y-6">
            

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-foreground mb-2">Policies</span>
              <span className="block text-gradient">Dashboard</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore available coverage options and manage your active insurance policies
            </p>
          </div>

          {/* Dashboard Component */}
          <PoliciesDashboard />
        </div>
      </div>
    </div>
  )
}
