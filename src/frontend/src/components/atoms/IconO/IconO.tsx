import { motion } from "framer-motion"
import styles from "./IconO.module.css"

interface IconOProps {
  className?: string
  animate?: boolean
}

export function IconO({ className = "", animate = false }: IconOProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="50"
        cy="50"
        r="30"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </svg>
  )
}
