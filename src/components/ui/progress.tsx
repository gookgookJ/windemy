import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-muted/30 shadow-inner",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-primary via-primary to-secondary transition-all duration-500 ease-out rounded-full relative overflow-hidden shadow-sm"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* 애니메이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
      <div className="absolute top-0 left-0 w-full h-0.5 bg-white/40 rounded-full" />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
