import { motion } from "framer-motion"
import { GameCell } from "../../molecules"
import styles from "./GameBoard.module.css"

interface GameBoardProps {
  board: (string | null)[]
  onCellClick: (index: number) => void
  winningLine?: number[]
  disabled?: boolean
}

// Calculer la position et l'angle de la ligne gagnante
const getWinningLineStyle = (winningLine: number[]) => {
  if (winningLine.length !== 3) return null

  // Positions des cellules dans une grille 3x3 (centres des cellules)
  const cellPositions = [
    { x: 16.67, y: 16.67 }, { x: 50, y: 16.67 }, { x: 83.33, y: 16.67 },
    { x: 16.67, y: 50 }, { x: 50, y: 50 }, { x: 83.33, y: 50 },
    { x: 16.67, y: 83.33 }, { x: 50, y: 83.33 }, { x: 83.33, y: 83.33 }
  ]

  const start = cellPositions[winningLine[0]]
  const end = cellPositions[winningLine[2]]

  // Calculer l'angle et la longueur
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return {
    left: `${start.x}%`,
    top: `${start.y}%`,
    width: `${length}%`,
    transform: `rotate(${angle}deg)`,
    transformOrigin: '0 50%'
  }
}

export function GameBoard({ 
  board, 
  onCellClick, 
  winningLine = [],
  disabled = false 
}: GameBoardProps) {
  const lineStyle = winningLine.length === 3 ? getWinningLineStyle(winningLine) : null

  return (
    <motion.div 
      className={styles.board}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 } as const}
    >
      {board.map((cell, index) => (
        <GameCell
          key={index}
          value={cell as "X" | "O" | null}
          onClick={() => onCellClick(index)}
          isWinning={winningLine.includes(index)}
          disabled={disabled}
        />
      ))}

      {/* Ligne gagnante */}
      {lineStyle && (
        <motion.div
          className={styles.winning_line}
          style={lineStyle}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" } as const}
        />
      )}
    </motion.div>
  )
}
