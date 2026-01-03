

"use client"

import { useState, useEffect } from "react"
import { Gamepad2, Trophy, Medal, Award, Crown, Flame, TrendingUp } from "lucide-react"
import { userService, LeaderboardEntry } from "@/services/userService"

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry, position: 1 | 2 | 3 }) {
  const positionStyles = {
    1: {
      gradient: "from-amber-400 via-yellow-500 to-orange-500",
      glow: "shadow-amber-500/30",
      icon: <Crown className="w-8 h-8 text-amber-400" />, height: "h-44", order: "order-2", scale: "scale-105",
    },
    2: {
      gradient: "from-slate-300 via-gray-400 to-slate-500",
      glow: "shadow-slate-400/20",
      icon: <Medal className="w-6 h-6 text-slate-300" />, height: "h-36", order: "order-1", scale: "scale-100",
    },
    3: {
      gradient: "from-orange-400 via-amber-600 to-orange-700",
      glow: "shadow-orange-500/20",
      icon: <Award className="w-6 h-6 text-orange-400" />, height: "h-32", order: "order-3", scale: "scale-100",
    },
  }
  const style = positionStyles[position]
  return (
    <div className={cn("flex flex-col items-center", style.order)}>
      <div className={cn("relative mb-3 transition-transform duration-300 hover:scale-110", style.scale)}>
        <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br blur-lg opacity-60", style.gradient)} />
        <div className={cn("relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br p-0.5", style.gradient)}>
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
            <Gamepad2 className={cn("w-8 h-8 md:w-10 md:h-10", position === 1 ? "text-amber-400" : position === 2 ? "text-slate-300" : "text-orange-400")} />
          </div>
        </div>
        <div className={cn("absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-card shadow-lg", style.gradient)}>
          {position}
        </div>
      </div>
      <div className={cn("relative w-28 md:w-36 rounded-t-2xl bg-gradient-to-b from-card to-muted overflow-hidden", "border border-border/50", "shadow-xl", style.glow, style.height)}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <div className="relative flex flex-col items-center pt-4 px-3">
          {style.icon}
          <p className="mt-2 font-semibold text-foreground text-sm md:text-base truncate w-full text-center">{entry.username}</p>
          <div className="mt-2 flex items-center gap-1 text-amber-500">
            <Flame className="w-4 h-4" />
            <span className="font-bold text-sm md:text-base">{entry.score}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{entry.wins}V / {entry.losses ?? 0}D</p>
        </div>
        <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r", style.gradient)} />
      </div>
    </div>
  )
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries
  return (
    <div className="relative py-8 px-4">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>
      <div className="relative flex items-end justify-center gap-3 md:gap-6">
        {second && <PodiumCard entry={second} position={2} />}
        {first && <PodiumCard entry={first} position={1} />}
        {third && <PodiumCard entry={third} position={3} />}
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, isCurrentUser, animationDelay }: { entry: LeaderboardEntry, isCurrentUser: boolean, animationDelay: number }) {
  const winRate = entry.gamesPlayed > 0 ? Math.round((entry.wins / entry.gamesPlayed) * 100) : 0
  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl",
        "bg-card/50 backdrop-blur-sm border border-border/50",
        "hover:bg-card hover:border-border hover:shadow-lg",
        "transition-all duration-300 ease-out",
        "animate-in fade-in slide-in-from-bottom-2",
        isCurrentUser && "ring-2 ring-primary/50 bg-primary/5",
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-muted font-bold text-muted-foreground">#{entry.rank}</div>
      <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border/50">
        <Gamepad2 className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{entry.username}</span>
          {isCurrentUser && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">Vous</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{entry.gamesPlayed} parties</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-emerald-500">{entry.wins}</div>
          <div className="text-xs text-muted-foreground">Victoires</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-rose-500">{entry.losses ?? 0}</div>
          <div className="text-xs text-muted-foreground">Défaites</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary">{winRate}%</div>
          <div className="text-xs text-muted-foreground">Win rate</div>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-4 border-l border-border/50">
        <Flame className="w-4 h-4 text-amber-500" />
        <span className="font-bold text-foreground text-lg">{entry.score}</span>
      </div>
    </div>
  )
}

function LeaderboardList({ entries, currentUserId }: { entries: LeaderboardEntry[], currentUserId?: string }) {
  return (
    <div className="space-y-3 px-1">
      {entries.map((entry, index) => (
        <LeaderboardRow
          key={entry.id}
          entry={entry}
          isCurrentUser={entry.id === currentUserId}
          animationDelay={index * 50}
        />
      ))}
    </div>
  )
}

export default function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = currentUserId || "id_de_l_utilisateur_connecte"

  useEffect(() => {
    userService.getLeaderboard()
      .then(setEntries)
      .catch(() => setError("Erreur lors du chargement du classement."))
      .finally(() => setLoading(false))
  }, [])

  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/50">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Classement Global</h1>
            <p className="text-sm text-muted-foreground">Meilleurs joueurs de la saison</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="text-sm font-medium text-muted-foreground">{entries.length} joueurs</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-full blur-3xl pointer-events-none" />
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Chargement du classement...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <Trophy className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="relative space-y-8">
            <Podium entries={podium} />
            {rest.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Autres joueurs</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <LeaderboardList entries={rest} currentUserId={userId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}