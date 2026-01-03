import { authService } from "./authService"

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

interface UserProfile {
  id: string
  username: string
  email: string
}

interface UserStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  score: number
  rank: number
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil')
    }

    return response.json()
  }

  async getStats(): Promise<UserStats> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/user/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques')
    }

    return response.json()
  }

  async updateProfile(username: string, email: string): Promise<UserProfile> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil')
    }

    return response.json()
  }
}

export const userService = new UserService()
