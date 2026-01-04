import type React from "react"
import { motion } from "framer-motion"
import styles from "./GameButton.module.css"

interface GameButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
  type?: "button" | "submit" | "reset"
}

export function GameButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  type = "button",
}: GameButtonProps) {
  const buttonClasses = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  )
}
