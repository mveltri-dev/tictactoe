import { motion } from "framer-motion"
import { Trophy, Medal, Award } from "lucide-react"
import type { LeaderboardEntry } from "@/services/userService"
import styles from "./OnlineHub.module.css"

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className={styles.rank_icon} style={{ color: '#fbbf24' }} />
    case 2:
      return <Medal className={styles.rank_icon} style={{ color: '#d1d5db' }} />
    case 3:
      return <Award className={styles.rank_icon} style={{ color: '#f97316' }} />
    default:
      return null
  }
}

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return styles.podium_card_gold
    case 2:
      return styles.podium_card_silver
    case 3:
      return styles.podium_card_bronze
    default:
      return ''
  }
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const topThree = entries.slice(0, 3)
  const restOfPlayers = entries.slice(3)

  // Réorganiser le podium : 2e place à gauche, 1ère au milieu, 3e à droite
  const podiumOrder = [
    topThree[1], // 2e place
    topThree[0], // 1ère place
    topThree[2]  // 3e place
  ].filter(Boolean)

  return (
    <div className={styles.leaderboard_wrapper}>
      {/* Podium top 3 */}
      {topThree.length > 0 && (
        <div className={styles.podium_container}>
          {podiumOrder.map((entry, index) => {
            if (!entry) return null
            
            return (
              <motion.div
                key={entry.id}
                className={`${styles.podium_card} ${getRankBg(entry.rank)}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.podium_avatar}>
                  {entry.username.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.podium_rank_icon}>
                  {getRankIcon(entry.rank)}
                </div>
                <p className={styles.podium_username}>{entry.username}</p>
                <p className={styles.podium_score}>{entry.score} ELO</p>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Liste des autres joueurs */}
      {restOfPlayers.length > 0 && (
        <div className={styles.leaderboard_list}>
          {restOfPlayers.map((entry, index) => (
            <motion.div
              key={entry.id}
              className={`${styles.leaderboard_item} ${
                entry.id === currentUserId ? styles.leaderboard_item_current : ''
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div className={styles.leaderboard_rank}>
                <span className={styles.rank_number}>#{entry.rank}</span>
              </div>
              
              <div className={styles.leaderboard_player_avatar}>
                {entry.username.substring(0, 2).toUpperCase()}
              </div>
              
              <div className={styles.leaderboard_player_info}>
                <p className={styles.leaderboard_player_name}>
                  {entry.username}
                  {entry.id === currentUserId && (
                    <span className={styles.you_badge_small}> (Vous)</span>
                  )}
                </p>
                <p className={styles.leaderboard_player_meta}>
                  {entry.wins}V / {entry.gamesPlayed - entry.wins}D
                </p>
              </div>
              
              <div className={styles.leaderboard_stats}>
                <div className={styles.stat_column}>
                  <p className={styles.stat_value_large}>{entry.score}</p>
                  <p className={styles.stat_label_small}>ELO</p>
                </div>
                <div className={styles.stat_column}>
                  <p className={styles.stat_value_green}>{entry.winRate.toFixed(1)}%</p>
                  <p className={styles.stat_label_small}>Win rate</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
