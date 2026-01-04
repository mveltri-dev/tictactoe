// DTO de réponse pour un joueur

import type { Symbol } from "../enums"

export interface PlayerDTO {
  id: string
  name: string
  symbol: Symbol
}
