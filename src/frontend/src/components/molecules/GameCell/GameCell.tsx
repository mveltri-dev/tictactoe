import { motion } from "framer-motion"
import { CellMark } from "../../atoms"
import { cn } from "@/lib/utils"
import styles from "./GameCell.module.css"

interface GameCellProps {
  value: "X" | "O" | null
  onClick: () => void
  isWinning?: boolean
  disabled?: boolean
}

export function GameCell({ value, onClick, isWinning = false, disabled = false }: GameCellProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={cn(
        styles.cell,
        isWinning && styles["cell--winning"],
        value === null && styles["cell--hoverable"],
      )}
      whileHover={!disabled && value === null ? { scale: 1.02 } : {}}
      whileTap={!disabled && value === null ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 } as const}
    >
      <CellMark mark={value} isWinning={isWinning} />

      {value === null && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/5"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  )
}
