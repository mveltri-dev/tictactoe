// DTO de réponse pour une partie

import type { Symbol, GameStatus } from "../enums"

export interface GameDTO {
  id: string
  board: (string | null)[]
  playerXId: string
  playerOId: string
  playerXName?: string | null
  playerOName?: string | null
  currentTurn: Symbol
  status: GameStatus
  winnerId: string | null
  winningLine: number[] | null
  createdAt: string
  mode: string
  width: number
  height: number
}
