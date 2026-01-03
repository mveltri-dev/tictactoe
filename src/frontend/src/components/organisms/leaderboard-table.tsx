"use client"

import { motion } from "framer-motion"
import { Avatar } from "../atoms/avatar"
import type { LeaderboardEntry } from "@/lib/types"

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary/10 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rang</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joueur</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Victoires</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Parties</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Taux</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <motion.tr
                key={entry.id}
                className={`border-b border-border transition-colors ${
                  entry.id === currentUserId ? "bg-primary/10" : "hover:bg-accent"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-6 py-4">
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      entry.rank === 1
                        ? "bg-yellow-500 text-white"
                        : entry.rank === 2
                          ? "bg-gray-400 text-white"
                          : entry.rank === 3
                            ? "bg-orange-600 text-white"
                            : "bg-muted text-foreground"
                    }`}
                  >
                    {entry.rank}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={entry.avatar} alt={entry.username} size="sm" />
                    <span className="font-medium text-foreground">{entry.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-game-x">{entry.wins}</td>
                <td className="px-6 py-4 text-right text-foreground">{entry.gamesPlayed}</td>
                <td className="px-6 py-4 text-right font-semibold text-game-o">{entry.winRate}%</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
