import { ClaimForm } from "@/components/claim/claim-form"

export const metadata = {
  title: "Submit Claim | HyperInsure",
  description: "Submit an insurance claim for delayed blockchain transactions",
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
          <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
            <div className="flex flex-col justify-start items-center gap-4">
              <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight md:leading-tight lg:leading-[40px]">
                Submit Insurance Claim
              </h2>
              <p className="self-stretch text-center text-muted-foreground text-sm md:text-sm lg:text-base font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed">
                Submit your transaction details to verify delay and process your claim
              </p>
            </div>
          </div>
          <div className="max-w-[800px] mx-auto w-full">
            <ClaimForm />
          </div>
        </div>
      </div>
      
      {/* Background elements similar to homepage */}
      <div className="absolute inset-0 top-[-90px] z-0 opacity-50">
        <svg
          className="w-full h-full"
          viewBox="0 0 1388 825"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g filter="url(#filter0_f_claim)">
            <ellipse
              cx="694"
              cy="-93.0414"
              rx="670.109"
              ry="354.908"
              fill="url(#paint1_radial_claim)"
              fillOpacity="0.5"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_claim"
              x="-234.109"
              y="-705.949"
              width="1856.22"
              height="1225.82"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="129" result="effect1_foregroundBlur_claim" />
            </filter>
            <radialGradient
              id="paint1_radial_claim"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(683.482 245.884) rotate(-3.78676) scale(469.009 248.4)"
            >
              <stop offset="0.1294" stopColor="hsl(var(--primary-dark))" />
              <stop offset="0.2347" stopColor="hsl(var(--primary))" />
              <stop offset="0.3" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
