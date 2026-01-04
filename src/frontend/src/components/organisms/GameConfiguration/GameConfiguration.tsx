import { useState } from "react"
import { motion } from "framer-motion"
import { GameButton } from "../../atoms"
import { PlayerNamesInput } from "../../molecules"
import type { Symbol, GameModeAPI } from "../../../dtos"
import { cn } from "@/lib/utils"
import styles from "./GameConfiguration.module.css"

interface GameConfigurationProps {
  gameMode: GameModeAPI
  onStartGame: (config: {
    player1Name: string
    player2Name: string
    chosenSymbol: Symbol
    gameMode: GameModeAPI
  }) => void
}

export function GameConfiguration({ gameMode, onStartGame }: GameConfigurationProps) {
  const [player1Name, setPlayer1Name] = useState("")
  const [player2Name, setPlayer2Name] = useState("")
  const [chosenSymbol, setChosenSymbol] = useState<Symbol>("X")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartGame({
      player1Name: player1Name || "Joueur 1",
      player2Name: gameMode === "VsComputer" ? "EasiBot" : player2Name || "Joueur 2",
      chosenSymbol: gameMode === "VsPlayerLocal" ? "X" : chosenSymbol,
      gameMode
    })
  }

  // Pour VsComputer: interface simplifiée avec juste le choix du symbole
  if (gameMode === "VsComputer") {
    return (
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 } as const}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Choisissez votre symbole</h2>
          <p className={styles.subtitle}>X commence toujours</p>
        </div>

        <div className={styles.symbol_grid}>
          <motion.button
            type="button"
            className={cn(
              styles.symbol_button,
              chosenSymbol === "X" ? styles['symbol_button--x_selected'] : styles['symbol_button--x']
            )}
            onClick={() => setChosenSymbol("X")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={cn(styles.symbol_text, styles['symbol_text--x'])}>X</span>
            <span className={styles.symbol_label}>Joueur X</span>
            {chosenSymbol === "X" && (
              <motion.div
                className={cn(styles.selected_badge, styles['selected_badge--x'])}
                layoutId="selected"
                transition={{ type: "spring", stiffness: 300 } as const}
              />
            )}
          </motion.button>

          <motion.button
            type="button"
            className={cn(
              styles.symbol_button,
              chosenSymbol === "O" ? styles['symbol_button--o_selected'] : styles['symbol_button--o']
            )}
            onClick={() => setChosenSymbol("O")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={cn(styles.symbol_text, styles['symbol_text--o'])}>O</span>
            <span className={styles.symbol_label}>Joueur O</span>
            {chosenSymbol === "O" && (
              <motion.div
                className={cn(styles.selected_badge, styles['selected_badge--o'])}
                layoutId="selected"
                transition={{ type: "spring", stiffness: 300 } as const}
              />
            )}
          </motion.button>
        </div>

        <GameButton 
          onClick={() => onStartGame({
            player1Name: "Joueur 1",
            player2Name: "EasiBot",
            chosenSymbol: chosenSymbol,
            gameMode: "VsComputer"
          })} 
          variant="primary"
          className={styles.submit_button}
        >
          Jouer contre EasiBot
        </GameButton>
      </motion.div>
    )
  }

  // Pour les autres modes: formulaire complet
  return (
    <motion.form 
      className={styles.container}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 } as const}
    >
      <h2 className={styles.title}>Configuration de la partie</h2>

      <PlayerNamesInput
        player1Name={player1Name}
        player2Name={player2Name}
        onPlayer1Change={setPlayer1Name}
        onPlayer2Change={setPlayer2Name}
        showPlayer2={gameMode === "VsPlayerLocal"}
      />

      {/* Afficher le choix de symbole uniquement si ce n'est pas VsPlayerLocal */}
      {gameMode !== "VsPlayerLocal" && (
        <div className={styles.choice_section}>
          <label className={styles.choice_label}>Choisir votre symbole</label>
          <div className={styles.choice_grid}>
            <motion.button
              type="button"
              className={cn(
                styles.choice_button,
                chosenSymbol === "X" ? styles['choice_button--x_selected'] : styles['choice_button--x']
              )}
              onClick={() => setChosenSymbol("X")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={cn(styles.choice_text, styles['choice_text--x'])}>X</span>
            </motion.button>
            <motion.button
              type="button"
              className={cn(
                styles.choice_button,
                chosenSymbol === "O" ? styles['choice_button--o_selected'] : styles['choice_button--o']
              )}
              onClick={() => setChosenSymbol("O")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={cn(styles.choice_text, styles['choice_text--o'])}>O</span>
            </motion.button>
          </div>
        </div>
      )}

      <GameButton type="submit" variant="primary" className={styles.submit_button}>
        Commencer la partie
      </GameButton>
    </motion.form>
  )
}

