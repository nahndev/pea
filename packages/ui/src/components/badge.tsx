import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "../lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        solid: "variant-solid",
        soft: "variant-soft",
        outlined: "variant-outlined",
      },
      intent: {
        primary: "primary",
        accent: "accent",
        neutral: "neutral",
        success: "success",
        warning: "warning",
        danger: "danger",
        info: "info",
      },
    },
    defaultVariants: {
      variant: "soft",
      intent: "neutral",
    },
  }
)

function Badge({
  className,
  variant,
  intent,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, intent }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
