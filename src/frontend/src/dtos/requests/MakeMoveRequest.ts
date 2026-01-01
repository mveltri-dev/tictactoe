// DTO de requête pour jouer un coup

export interface MakeMoveRequest {
  gameId: string
  playerId: string
  position: number // 0-8 (index dans le tableau board)
}
