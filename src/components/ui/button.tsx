import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'glow' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50 hover:from-purple-600 hover:to-blue-600 hover:shadow-purple-500/70': variant === 'default',
            'hover:bg-white/10 text-zinc-300': variant === 'ghost',
            'border border-white/20 hover:bg-white/5 text-zinc-300': variant === 'outline',
            'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/50 hover:from-amber-600 hover:to-orange-600': variant === 'glow',
            'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 hover:from-red-600 hover:to-pink-600': variant === 'danger',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
