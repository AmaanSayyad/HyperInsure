import { PolicyPurchase } from "@/components/purchase/policy-purchase"

export const metadata = {
  title: "Purchase Insurance | HyperInsure",
  description: "Purchase insurance coverage for your blockchain transactions",
}

export default function PurchasePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
          <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-start items-center gap-4">
              <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight md:leading-tight lg:leading-[40px]">
                Purchase Insurance
              </h2>
              <p className="self-stretch text-center text-muted-foreground text-sm md:text-sm lg:text-base font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed">
                Choose a coverage plan that fits your transaction needs
              </p>
            </div>
          </div>
          <div className="max-w-[1100px] mx-auto w-full">
            <PolicyPurchase />
          </div>
        </div>
      </div>
      
      {/* Background gradient similar to homepage */}
      <div className="w-[670px] h-[350px] absolute top-[150px] right-[-100px] origin-top-left rotate-[-15deg] bg-primary/10 blur-[130px] z-0" />
      <div className="w-[300px] h-[500px] absolute bottom-[50px] left-[80px] origin-top-left rotate-[25deg] bg-primary/5 blur-[100px] z-0" />
    </div>
  )
}
