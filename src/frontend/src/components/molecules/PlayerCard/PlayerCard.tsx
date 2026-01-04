import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { Symbol } from "../../../dtos"
import styles from "./PlayerCard.module.css"

interface PlayerCardProps {
  name: string
  symbol: Symbol
  isActive: boolean
  isYou: boolean
  score: number
}

export function PlayerCard({ name, symbol, isActive, isYou, score }: PlayerCardProps) {
  return (
    <motion.div 
      className={cn(
        styles.card, 
        styles[`card--${symbol.toLowerCase()}`],
        isActive && styles['card--active']
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 } as const}
      whileHover={{ scale: 1.03 }}
    >
      <div className={styles.card__header}>
        <div className={styles.card__info}>
          <span className={cn(styles.card__symbol, styles[`card__symbol--${symbol.toLowerCase()}`])}>
            {symbol}
          </span>
          <div>
            <span className={styles.card__name}>{name}</span>
            {isYou && <span className={styles.card__badge}>Vous</span>}
          </div>
        </div>
      </div>
      <motion.div 
        className={styles.card__score}
        key={score}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 } as const}
      >
        {score}
      </motion.div>
    </motion.div>
  )
}

