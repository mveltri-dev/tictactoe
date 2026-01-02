import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Users, Wifi, ChevronDown } from "lucide-react"
import type { GameMode } from "@/dtos"
import { cn } from "@/lib/utils"
import styles from "./GameModeSelector.module.css"

interface GameModeSelectorProps {
  currentMode: GameMode
  onSelectMode: (mode: GameMode) => void
  isLoggedIn: boolean
  onLoginClick: () => void
}

export function GameModeSelector({ currentMode, onSelectMode, isLoggedIn, onLoginClick }: GameModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const modes = [
    { id: "ai" as GameMode, label: "Contre EasiBot", icon: Cpu, requiresAuth: false },
    { id: "local" as GameMode, label: "2 joueurs (local)", icon: Users, requiresAuth: false },
    { id: "friend" as GameMode, label: "Contre un ami", icon: Wifi, requiresAuth: true },
  ]

  const currentModeData = modes.find((m) => m.id === currentMode)

  const handleSelectMode = (mode: GameMode, requiresAuth: boolean) => {
    if (requiresAuth && !isLoggedIn) {
      onLoginClick()
      setIsOpen(false)
      return
    }
    onSelectMode(mode)
    setIsOpen(false)
  }

  return (
    <div className={styles.container}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {currentModeData && <currentModeData.icon className={styles.trigger__icon} />}
        <span>{currentModeData?.label}</span>
        <ChevronDown className={cn(styles.trigger__chevron, isOpen && styles['trigger__chevron--open'])} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 } as const}
            >
              <div className={styles.dropdown__header}>
                <h3 className={styles.dropdown__title}>Mode de jeu</h3>
                <p className={styles.dropdown__subtitle}>Choisissez comment jouer</p>
              </div>
              
              <div className={styles.dropdown__list}>
              {modes.map((mode) => {
                const iconClass = cn(
                  styles.mode_button__icon,
                  mode.id === 'ai' && styles['mode_button__icon--ai'],
                  mode.id === 'local' && styles['mode_button__icon--local'],
                  mode.id === 'friend' && styles['mode_button__icon--friend']
                )
                
                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode.id, mode.requiresAuth)}
                    className={styles.mode_button}
                    whileHover={{ x: 3 }}
                  >
                    <div className={styles.mode_button__content}>
                      <mode.icon className={iconClass} />
                      <span className={styles.mode_button__label}>{mode.label}</span>
                    </div>
                    {mode.requiresAuth && !isLoggedIn && (
                      <span className={cn(styles.mode_button__badge, styles['mode_button__badge--locked'])}>Connexion</span>
                    )}
                    {currentMode === mode.id && (
                      <span className={cn(styles.mode_button__badge, styles['mode_button__badge--active'])}>Actif</span>
                    )}
                  </motion.button>
                )
              })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
