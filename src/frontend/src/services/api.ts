import type { CreateGameRequest, MakeMoveRequest, GameDTO } from "../dtos"

// Privilégier l'URL locale en développement
const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    console.log('API Request:', url, options?.method || 'GET')
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
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

  async playAiMove(gameId: string): Promise<GameDTO> {
    return this.request<GameDTO>(`/api/game/${gameId}/ai-move`, {
      method: "POST",
    })
  }
}

export const api = new ApiService()

