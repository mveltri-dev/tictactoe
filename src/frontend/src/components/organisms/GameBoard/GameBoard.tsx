import { motion } from "framer-motion"
import { GameCell } from "../../molecules"
import styles from "./GameBoard.module.css"

interface GameBoardProps {
  board: (string | null)[]
  onCellClick: (index: number) => void
  winningLine?: number[]
  disabled?: boolean
  rows?: number
  cols?: number
}

// Calculer la position et l'angle de la ligne gagnante pour une grille NxM
const getWinningLineStyle = (winningLine: number[], rows: number, cols: number) => {
  if (winningLine.length < 2) return null

  // Calcule la position centrale de chaque cellule en %
  const getCellCenter = (index: number) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = ((col + 0.5) / cols) * 100
    const y = ((row + 0.5) / rows) * 100
    return { x, y }
  }

  const start = getCellCenter(winningLine[0])
  const end = getCellCenter(winningLine[winningLine.length - 1])

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
  disabled = false,
  rows,
  cols
}: GameBoardProps) {
  // Déduire la taille si non fournie, mais loguer pour debug
  const nRows = rows || Math.sqrt(board.length)
  const nCols = cols || Math.ceil(board.length / (rows || Math.sqrt(board.length)))
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[GameBoard] board.length=${board.length}, rows=${rows}, cols=${cols}, nRows=${nRows}, nCols=${nCols}`)
  }
  // Correction : si board.length !== nRows * nCols, afficher un warning
  if (typeof window !== "undefined" && nRows * nCols !== board.length) {
    // eslint-disable-next-line no-console
    console.warn(`[GameBoard] Incohérence : board.length=${board.length} mais nRows*nCols=${nRows * nCols}`)
  }
  const lineStyle = winningLine.length >= 2 ? getWinningLineStyle(winningLine, nRows, nCols) : null

  return (
    <motion.div 
      className={styles.board}
      style={{
        gridTemplateColumns: `repeat(${nCols}, 1fr)`
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 } as const}
    >
      {Array.from({ length: nRows * nCols }).map((_, index) => (
        <GameCell
          key={index}
          value={board[index] as "X" | "O" | null}
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
