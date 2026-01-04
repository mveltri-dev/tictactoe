// DTO de requête pour créer une partie

import type { Symbol, GameModeAPI } from "../enums"

export interface CreateGameRequest {
  player1Name: string
  chosenSymbol: Symbol
  gameMode: GameModeAPI
  player2Name?: string | null
  width?: number
  height?: number
}
