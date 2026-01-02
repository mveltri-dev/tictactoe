import { GameButton } from "@/components/atoms/GameButton"
import { RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import styles from "./GameControls.module.css"

interface GameControlsProps {
  onRestart: () => void
  showRestart: boolean
}

export function GameControls({ onRestart, showRestart }: GameControlsProps) {
  if (!showRestart) return null

  return (
    <motion.div
      className={styles.controls}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <GameButton onClick={onRestart} variant="secondary" className={styles.controls__button}>
        <RotateCcw className={styles.controls__icon} />
        Rejouer
      </GameButton>
    </motion.div>
  )
}
