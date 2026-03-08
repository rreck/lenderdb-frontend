import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-zinc-800 text-zinc-300",
        outline: "text-foreground border-zinc-700",
        success: "border-transparent bg-green-950 text-green-400",
        warning: "border-transparent bg-yellow-950 text-yellow-300",
        danger: "border-transparent bg-red-950 text-red-400",
        blue: "border-transparent bg-blue-950 text-blue-300",
        purple: "border-transparent bg-purple-950 text-purple-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
