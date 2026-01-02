// DTO de réponse pour une partie

import type { Symbol, GameStatus } from "../enums"

export interface GameDTO {
  id: string
  board: (string | null)[]
  playerXId: string
  playerOId: string
  currentTurn: Symbol
  status: GameStatus
  winnerId: string | null
  winningLine: number[] | null
  createdAt: string
  mode: string
}
