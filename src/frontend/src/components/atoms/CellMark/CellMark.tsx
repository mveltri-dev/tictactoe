import { motion } from "framer-motion"
import { IconX } from "../IconX/IconX"
import { IconO } from "../IconO/IconO"
import styles from "./CellMark.module.css"

interface CellMarkProps {
  mark: "X" | "O" | null
  isWinning?: boolean
}

export function CellMark({ mark, isWinning = false }: CellMarkProps) {
  if (!mark) return null

  const variants = {
    hidden: { scale: 0, opacity: 0, rotate: -180 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  }

  const winningVariants = {
    winning: {
      scale: [1, 1.15, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  }

  const cellMarkClasses = [
    styles['cell-mark'],
    mark === "X" ? styles['cell-mark--x'] : styles['cell-mark--o']
  ].join(' ')

  return (
    <motion.div
      className={cellMarkClasses}
      initial="hidden"
      animate={isWinning ? "winning" : "visible"}
      variants={isWinning ? winningVariants : variants}
    >
      {mark === "X" ? <IconX animate /> : <IconO animate />}
    </motion.div>
  )
}
