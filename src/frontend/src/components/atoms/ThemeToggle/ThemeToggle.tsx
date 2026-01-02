import { Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import styles from "./ThemeToggle.module.css"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className={styles.toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div 
        initial={false} 
        animate={{ rotate: theme === "dark" ? 180 : 0 }} 
        transition={{ duration: 0.3 }}
      >
        {theme === "light" ? (
          <Moon className={styles.toggle__icon} />
        ) : (
          <Sun className={styles.toggle__icon} />
        )}
      </motion.div>
    </motion.button>
  )
}
