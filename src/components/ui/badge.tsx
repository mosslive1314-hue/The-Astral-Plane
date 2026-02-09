import * as React from "react"
import { cn } from "@/lib/utils"
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/constants"
import type { SkillRarity } from "@/types"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rarity' | 'category' | 'price' | 'outline' | 'secondary'
  rarity?: SkillRarity
  value?: string | number
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', rarity, value, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          {
            'bg-white/10 text-zinc-300': variant === 'default',
            [RARITY_COLORS[rarity || 'common'] + ' text-white']: variant === 'rarity' && rarity,
            'bg-purple-500/20 text-purple-400 border border-purple-500/30': variant === 'category',
            'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'price',
            'border border-zinc-700 text-zinc-400': variant === 'outline',
            'bg-white/5 text-zinc-300': variant === 'secondary',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
