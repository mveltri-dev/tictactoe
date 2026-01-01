import type { ButtonHTMLAttributes } from "react"
import "./Button.css"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  disabled,
  ...props 
}: ButtonProps) {
  const classes = `button button--${variant} button--${size} ${className}`
  
  return (
    <button 
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
