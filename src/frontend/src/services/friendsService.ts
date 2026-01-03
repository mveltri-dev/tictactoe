import { authService } from "./authService"

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

export interface Friend {
  id: string
  username: string
  avatar: string
  status: "online" | "offline" | "in-game"
  score: number
  wins: number
  losses: number
  draws: number
  gamesPlayed: number
  winRate: number
  rank: number
}

export interface FriendRequest {
  id: number
  requesterId: string
  username: string
  avatar: string
  createdAt: string
}

class FriendsService {
  async getFriends(): Promise<Friend[]> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des amis')
    }

    return response.json()
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des demandes d\'amis')
    }

    return response.json()
  }

  async sendFriendRequest(userId: string): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de l\'envoi de la demande d\'ami')
    }
  }

  async acceptFriendRequest(friendshipId: number): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}/accept`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'acceptation de la demande')
    }
  }

  async rejectFriendRequest(friendshipId: number): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors du refus de la demande')
    }
  }

  async removeFriend(friendshipId: number): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/${friendshipId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'ami')
    }
  }

  async searchUsers(query: string): Promise<Friend[]> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la recherche d\'utilisateurs')
    }

    return response.json()
  }

  async getFriendStats(friendId: string): Promise<Friend> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/friends/${friendId}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques de l\'ami')
    }

    return response.json()
  }
}

export const friendsService = new FriendsService()
