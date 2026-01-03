"use client"

import { motion } from "framer-motion"
import { Trophy, Medal, Award } from "lucide-react"
import { mockLeaderboard } from "@/lib/mock-data"

interface LeaderboardViewProps {
  currentUserId: string
}

export function LeaderboardView({ currentUserId }: LeaderboardViewProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50"
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50"
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50"
      default:
        return "bg-background/50 border-border"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Classement Global</h3>
        <span className="text-sm text-muted-foreground">{mockLeaderboard.length} joueurs</span>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {mockLeaderboard.slice(0, 3).map((player, index) => (
          <motion.div
            key={player.id}
            className={`text-center p-4 rounded-2xl border ${getRankBg(player.rank)} ${index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={`w-14 h-14 mx-auto mb-2 rounded-xl flex items-center justify-center text-2xl bg-background/80 border ${index === 0 ? "border-yellow-500" : index === 1 ? "border-gray-400" : "border-amber-600"}`}
            >
              {player.avatar}
            </div>
            <div className="mb-1">{getRankIcon(player.rank)}</div>
            <p className="font-semibold text-foreground text-sm truncate">{player.username}</p>
            <p className="text-xs text-muted-foreground">{player.score} pts</p>
          </motion.div>
        ))}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {mockLeaderboard.slice(3).map((player, index) => (
          <motion.div
            key={player.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              player.id === currentUserId
                ? "bg-primary/10 border-primary/50"
                : "bg-background/50 border-border hover:border-primary/30"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            <div className="w-8 text-center">{getRankIcon(player.rank)}</div>
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-xl">
              {player.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${player.id === currentUserId ? "text-primary" : "text-foreground"}`}>
                {player.username}
                {player.id === currentUserId && <span className="ml-2 text-xs">(Vous)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {player.wins}V / {player.gamesPlayed - player.wins}D
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{player.score}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="font-medium text-green-500">{player.winRate}%</p>
              <p className="text-xs text-muted-foreground">Win rate</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
