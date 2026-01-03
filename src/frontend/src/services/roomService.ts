import type { RoomDTO } from "../dtos"
import { authService } from "./authService"

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

class RoomService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = authService.getToken()
    const url = `${BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur API ${response.status}: ${errorText || response.statusText}`)
    }

    return response.json()
  }

  async createRoom(name: string): Promise<RoomDTO> {
    return this.request<RoomDTO>("/api/room", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async joinRoom(code: string): Promise<RoomDTO> {
    return this.request<RoomDTO>("/api/room/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  async startGame(roomId: string): Promise<RoomDTO> {
    return this.request<RoomDTO>(`/api/room/${roomId}/start`, {
      method: "POST",
    })
  }

  async getMyRooms(): Promise<RoomDTO[]> {
    return this.request<RoomDTO[]>("/api/room/my-rooms")
  }
}

export const roomService = new RoomService()
