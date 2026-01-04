import { ScoreBadge } from "@/components/atoms/ScoreBadge"
import { motion } from "framer-motion"
import type { GameMode } from "@/dtos"
import styles from "./ScorePanel.module.css"

interface ScorePanelProps {
  xWins: number
  oWins: number
  draws: number
  player1Name?: string
  player2Name?: string
  gameMode: GameMode
}

export function ScorePanel({ xWins, oWins, draws, player1Name, player2Name, gameMode }: ScorePanelProps) {
  const getPlayer1Label = () => {
    if (gameMode === "local" && player1Name) return player1Name
    if (gameMode === "ai") return "Vous"
    return "Joueur X"
  }

  const getPlayer2Label = () => {
    if (gameMode === "local" && player2Name) return player2Name
    if (gameMode === "ai") return "EasiBot"
    return "Joueur O"
  }

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ScoreBadge label={getPlayer1Label()} value={xWins} variant="x" />
      <ScoreBadge label="Nuls" value={draws} variant="draw" />
      <ScoreBadge label={getPlayer2Label()} value={oWins} variant="o" />
    </motion.div>
  )
}
