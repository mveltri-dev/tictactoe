import { motion } from "framer-motion"
import styles from "./ScoreBadge.module.css"

interface ScoreBadgeProps {
  label: string
  value: number
  variant?: "x" | "o" | "draw"
  className?: string
}

export function ScoreBadge({ label, value, variant = "draw", className }: ScoreBadgeProps) {
  const badgeClasses = [
    styles.badge,
    styles[`badge--${variant}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <motion.div
      className={badgeClasses}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <span className={styles.badge__label}>{label}</span>
      <motion.span
        key={value}
        className={styles.badge__value}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.span>
    </motion.div>
  )
}
