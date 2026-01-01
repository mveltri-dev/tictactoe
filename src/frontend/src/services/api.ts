import type { CreateGameRequest, MakeMoveRequest, GameDTO } from "../dtos"

// Utilise la variable d'environnement configurée dans .env.local ou .env.production
const BASE_URL = import.meta.env.VITE_API_URL

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur API ${response.status}: ${errorText || response.statusText}`)
    }

    return response.json()
  }

  async createGame(request: CreateGameRequest): Promise<GameDTO> {
    return this.request<GameDTO>("/api/game", {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  async getGame(id: string): Promise<GameDTO> {
    return this.request<GameDTO>(`/api/game/${id}`)
  }

  async makeMove(request: MakeMoveRequest): Promise<GameDTO> {
    return this.request<GameDTO>(`/api/game/${request.gameId}/moves`, {
      method: "POST",
      body: JSON.stringify(request),
    })
  }
}

export const api = new ApiService()

