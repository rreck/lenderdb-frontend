import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-gray-100 text-gray-700",
        outline: "text-foreground border-gray-200",
        success: "border-transparent bg-green-100 text-green-700",
        warning: "border-transparent bg-yellow-100 text-yellow-700",
        danger: "border-transparent bg-red-100 text-red-700",
        blue: "border-transparent bg-blue-100 text-blue-700",
        purple: "border-transparent bg-purple-100 text-purple-700",
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
