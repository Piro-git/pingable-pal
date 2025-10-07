import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-realistic",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-realistic-lg",
        secondary: "border-white/10 bg-bg-lighter/60 backdrop-blur-xl text-secondary-foreground hover:bg-bg-lighter/80 hover:shadow-realistic-lg",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-realistic-lg",
        outline: "text-foreground border-white/20 bg-bg-base/40 backdrop-blur-xl hover:bg-bg-lighter/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
