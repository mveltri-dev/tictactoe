import type React from "react"
import { motion } from "framer-motion"
import { GameHeader } from "@/components/organisms/GameHeader"
import styles from "./GameLayout.module.css"

import type { GameMode } from "@/dtos"

interface GameLayoutProps {
  children: React.ReactNode
  isSoundEnabled: boolean
  onSoundToggle: () => void
  language: string
  onLanguageChange: (lang: string) => void
  currentMode: GameMode
  onSelectMode: (mode: GameMode) => void
}

export function GameLayout({ children, isSoundEnabled, onSoundToggle, language, onLanguageChange, currentMode, onSelectMode }: GameLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.background} />

      <motion.div
        className={styles.animated_blob}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        } as const}
      />

      <div className={styles.content}>
        <div className={styles.inner}>
          <GameHeader
            isSoundEnabled={isSoundEnabled}
            onSoundToggle={onSoundToggle}
            language={language}
            onLanguageChange={onLanguageChange}
            currentMode={currentMode}
            onSelectMode={onSelectMode}
          />
          {children}
        </div>
      </div>
    </div>
  )
}
