import { PolicyCreator } from "@/components/admin/policy-creator"

export const metadata = {
  title: "Admin | HyperInsure",
  description: "Create and manage insurance policies for transaction delay protection",
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
          <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-start items-center gap-4">
              <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight md:leading-tight lg:leading-[40px]">
                Admin Dashboard
              </h2>
              <p className="self-stretch text-center text-muted-foreground text-sm md:text-sm lg:text-base font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed">
                Create and manage insurance policies for transaction delay protection
              </p>
            </div>
          </div>
          <div className="max-w-[1100px] mx-auto w-full">
            <PolicyCreator />
          </div>
        </div>
      </div>
      
      {/* Background gradient similar to homepage */}
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0" />
    </div>
  )
}
