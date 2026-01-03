import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Sun, Moon, Volume2, VolumeX, Globe, BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [view, setView] = useState<"main" | "rules">("main")
  const { theme, toggleTheme } = useTheme()

  const handleRulesView = () => {
    setView("rules")
  }

  const handleBackToSettings = () => {
    setView("main")
  }

  // Section: Règles du jeu (structuré, complet)
  const rulesContent = (
    <div className={styles.rules_content}>
      <div className={styles.rules_section}>
        <h4 className={styles.rules_section__title}>But du jeu</h4>
        <p className={styles.rules_section__text}>
          <strong>Tic Tac Toe</strong> est un jeu de réflexion pour deux joueurs. L’objectif est d’aligner <strong>3 symboles identiques</strong> (croix ou ronds) sur une grille de taille personnalisable.
        </p>
      </div>
      <div className={styles.rules_section}>
        <h4 className={styles.rules_section__title}>Déroulement</h4>
        <ul className={styles.rules_list}>
          <li>La partie se joue à deux joueurs, X et O.</li>
          <li>Le joueur X commence toujours la partie.</li>
          <li>Les joueurs jouent à tour de rôle et placent leur symbole sur une case vide du plateau.</li>
          <li>Une case occupée ne peut plus être modifiée.</li>
        </ul>
      </div>
      <div className={styles.rules_section}>
        <h4 className={styles.rules_section__title}>Condition de victoire</h4>
        <ul className={styles.rules_list}>
          <li>Le premier joueur à aligner <strong>3 symboles identiques</strong> horizontalement, verticalement ou en diagonale remporte la partie.</li>
          <li>Si toutes les cases sont remplies sans alignement, la partie est déclarée <strong>nulle</strong>.</li>
        </ul>
      </div>
      <div className={styles.rules_section}>
        <h4 className={styles.rules_section__title}>Personnalisation du plateau</h4>
        <p className={styles.rules_section__text}>
          Vous pouvez choisir la taille de la grille dans les paramètres. <br />
          <strong>La règle d’alignement reste toujours 3 symboles</strong>, quelle que soit la taille du plateau.
        </p>
      </div>
      <div className={styles.rules_section}>
        <h4 className={styles.rules_section__title}>Conseils stratégiques</h4>
        <ul className={styles.rules_list}>
          <li>Essayez de bloquer votre adversaire tout en créant vos propres opportunités d’alignement.</li>
          <li>Sur les grandes grilles, anticipez plusieurs coups à l’avance.</li>
          <li>Privilégiez le centre du plateau pour maximiser vos chances de victoire.</li>
        </ul>
      </div>
    </div>
  )

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
              {view === "main" ? (
                <>
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

                    {/* Rules Button */}
                    <motion.button
                      onClick={handleRulesView}
                      className={styles.menu_item}
                      whileHover={{ x: 2 }}
                    >
                      <div className={styles.menu_item__content}>
                        <BookOpen className={styles.menu_item__icon} />
                        <span className={styles.menu_item__label}>Règles du jeu</span>
                      </div>
                      <span className={styles.menu_item__value}>→</span>
                    </motion.button>
                  </div>
                </>
              ) : (
                // VUE RÈGLES : header + chevron right + contenu des règles
                <>
                  <div className={styles.dropdown__header}>
                    <button
                      onClick={handleBackToSettings}
                      className={styles.back_button}
                      aria-label="Retour"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div>
                      <h3 className={styles.dropdown__title}>Règles du jeu</h3>
                      <p className={styles.dropdown__subtitle}>Comment jouer à Easi</p>
                    </div>
                  </div>
                  {rulesContent}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
