import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Cpu } from "lucide-react"
import type { Symbol, GameMode } from "@/dtos"
import { cn } from "@/lib/utils"
import styles from "./StatusDisplay.module.css"

interface StatusDisplayProps {
  currentPlayer: Symbol
  winner: Symbol | "draw" | null
  isDraw: boolean
  isAiTurn?: boolean
  player1Name?: string
  player2Name?: string
  gameMode: GameMode
  playerSymbol?: Symbol // Symbole choisi par le joueur humain
}

export function StatusDisplay({
  currentPlayer,
  winner,
  isDraw,
  isAiTurn = false,
  player1Name,
  player2Name,
  gameMode,
  playerSymbol,
}: StatusDisplayProps) {
  const getMessage = () => {
    if (winner === "draw" || isDraw) {
      return "Match Nul !"
    }
    if (winner) {
      if (gameMode === "local" && player1Name && player2Name) {
        return `${winner === "X" ? player1Name : player2Name} gagne !`
      }
      if (gameMode === "ai") {
        // Vérifier si le gagnant est le joueur humain ou EasiBot
        return winner === playerSymbol ? "Vous avez gagné !" : "EasiBot gagne !"
      }
      return `Joueur ${winner} gagne !`
    }
    if (isAiTurn) {
      return "Au tour d'EasiBot"
    }
    if (gameMode === "local" && player1Name && player2Name) {
      return `Tour de ${currentPlayer === "X" ? player1Name : player2Name}`
    }
    if (gameMode === "ai") {
      return currentPlayer === playerSymbol ? "À votre tour" : "Au tour d'EasiBot"
    }
    return `Tour du Joueur ${currentPlayer}`
  }

  const getColor = () => {
    if (winner === "X") return styles["status__text--x"]
    if (winner === "O") return styles["status__text--o"]
    if (currentPlayer === "X") return styles["status__text--x"]
    return styles["status__text--o"]
  }

  return (
    <motion.div
      className={styles.status}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 } as const}
    >
      <AnimatePresence mode="wait">
        {winner && (
          <motion.div
            key="trophy"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200 } as const}
          >
            <Trophy className={styles.status__trophy} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h2
        key={getMessage()}
        className={cn(styles.status__text, getColor())}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 } as const}
      >
        {getMessage()}
      </motion.h2>
    </motion.div>
  )
}
