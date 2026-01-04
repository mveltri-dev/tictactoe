import { motion } from "framer-motion"
import { SettingsMenu } from "@/components/organisms/SettingsMenu"
import { GameModeSelector } from "@/components/organisms/GameModeSelector"
import type { GameMode } from "@/dtos"
import styles from "./GameHeader.module.css"

interface GameHeaderProps {
  isSoundEnabled: boolean
  onSoundToggle: () => void
  language: string
  onLanguageChange: (lang: string) => void
  currentMode: GameMode
  onSelectMode: (mode: GameMode) => void
}

export function GameHeader({ isSoundEnabled, onSoundToggle, language, onLanguageChange, currentMode, onSelectMode }: GameHeaderProps) {
  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 } as const}
    >
      <div>
        <h1 className={styles.title}>Tic-Tac-Toe</h1>
        <p className={styles.subtitle}>Propulsé par Easi</p>
      </div>
      <div className={styles.header_right}>
        <SettingsMenu
          isSoundEnabled={isSoundEnabled}
          onSoundToggle={onSoundToggle}
          language={language}
          onLanguageChange={onLanguageChange}
        />
        <GameModeSelector
          currentMode={currentMode}
          onSelectMode={onSelectMode}
        />
      </div>
    </motion.header>
  )
}

