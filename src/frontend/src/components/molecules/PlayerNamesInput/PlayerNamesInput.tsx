import type React from "react"
import { motion } from "framer-motion"
import { User } from "lucide-react"
import styles from "./PlayerNamesInput.module.css"

interface PlayerNamesInputProps {
  player1Name: string
  player2Name: string
  onPlayer1Change: (value: string) => void
  onPlayer2Change: (value: string) => void
  showPlayer2?: boolean
}

export function PlayerNamesInput({ 
  player1Name, 
  player2Name, 
  onPlayer1Change, 
  onPlayer2Change, 
  showPlayer2 = true 
}: PlayerNamesInputProps) {
  return (
    <motion.div
      className={styles.inputs}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles['input-group']}>
        <label className={styles['input-group__label']}>
          <User className={styles['input-group__icon']} />
          Joueur 1 (X)
        </label>
        <input
          type="text"
          value={player1Name}
          onChange={(e) => onPlayer1Change(e.target.value)}
          placeholder="Entrez le nom du joueur 1"
          className={styles['input-group__field']}
          maxLength={20}
        />
      </div>

      {showPlayer2 && (
        <div className={styles['input-group']}>
          <label className={styles['input-group__label']}>
            <User className={styles['input-group__icon']} />
            Joueur 2 (O)
          </label>
          <input
            type="text"
            value={player2Name}
            onChange={(e) => onPlayer2Change(e.target.value)}
            placeholder="Entrez le nom du joueur 2"
            className={styles['input-group__field']}
            maxLength={20}
          />
        </div>
      )}
    </motion.div>
  )
}
