import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Sun, Moon, Volume2, VolumeX, Globe } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import styles from "./SettingsMenu.module.css"

interface SettingsMenuProps {
  isSoundEnabled: boolean
  onSoundToggle: () => void
  language: string
  onLanguageChange: (lang: string) => void
}

export function SettingsMenu({ isSoundEnabled, onSoundToggle, language, onLanguageChange }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()


  return (
    <div className={styles.container}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className={styles.trigger__icon} />
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
                <h3 className={styles.dropdown__title}>Paramètres</h3>
                <p className={styles.dropdown__subtitle}>Personnalisez votre expérience</p>
              </div>

              <div className={styles.dropdown__list}>
                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  className={styles.menu_item}
                  whileHover={{ x: 2 }}
                >
                  <div className={styles.menu_item__content}>
                    {theme === "light" ? (
                      <Sun className={styles.menu_item__icon} />
                    ) : (
                      <Moon className={styles.menu_item__icon} />
                    )}
                    <span className={styles.menu_item__label}>Thème</span>
                  </div>
                  <span className={cn(styles.menu_item__value, styles['menu_item__value--capitalize'])}>
                    {theme === "light" ? "Clair" : "Sombre"}
                  </span>
                </motion.button>

                {/* Sound Toggle */}
                <motion.button
                  onClick={onSoundToggle}
                  className={styles.menu_item}
                  whileHover={{ x: 2 }}
                >
                  <div className={styles.menu_item__content}>
                    {isSoundEnabled ? (
                      <Volume2 className={styles.menu_item__icon} />
                    ) : (
                      <VolumeX className={styles.menu_item__icon} />
                    )}
                    <span className={styles.menu_item__label}>Son</span>
                  </div>
                  <span className={styles.menu_item__value}>{isSoundEnabled ? "Activé" : "Désactivé"}</span>
                </motion.button>

                {/* Language Selector */}
                <motion.button
                  onClick={() => onLanguageChange(language === "fr" ? "en" : "fr")}
                  className={styles.menu_item}
                  whileHover={{ x: 2 }}
                >
                  <div className={styles.menu_item__content}>
                    <Globe className={styles.menu_item__icon} />
                    <span className={styles.menu_item__label}>Langue</span>
                  </div>
                  <span className={cn(styles.menu_item__value, styles['menu_item__value--uppercase'])}>{language}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
