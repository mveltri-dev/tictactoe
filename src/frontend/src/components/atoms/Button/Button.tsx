import type { ButtonHTMLAttributes } from "react"
import { motion } from 'framer-motion'
import styles from "./Button.module.css"

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
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
  const buttonClasses = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <motion.button 
      className={buttonClasses}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
