import { PoliciesList } from "@/components/policies/policies-list"

export const metadata = {
  title: "Policies | HyperInsure",
  description: "View all available insurance policies for transaction delay protection",
}

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
          <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-start items-center gap-4">
              <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight md:leading-tight lg:leading-[40px]">
                Insurance Policies
              </h2>
              <p className="self-stretch text-center text-muted-foreground text-sm md:text-sm lg:text-base font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed">
                View all available insurance policies for transaction delay protection
              </p>
            </div>
          </div>
          <div className="max-w-[1100px] mx-auto w-full">
            <PoliciesList />
          </div>
        </div>
      </div>
      
      {/* Background gradient similar to homepage */}
      <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
    </div>
  )
}
