import * as signalR from "@microsoft/signalr"
import { authService } from "./authService"

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

export interface MatchFoundData {
  gameId: string
  opponentId: string
  opponentUsername: string
  yourSymbol: "X" | "O"
  opponentSymbol: "X" | "O"
}

export interface GameInvitationData {
  gameId: string
  inviterId: string
  inviterUsername: string
  yourSymbol: "X" | "O"
  inviterSymbol: "X" | "O"
}

export interface InvitationDeclinedData {
  gameId: string
  declinerUsername: string
}

export interface InvitationAcceptedData {
  gameId: string
  accepterUsername: string
  accepterId: string
}

class MatchmakingService {
  private connection: signalR.HubConnection | null = null
  private onMatchFoundCallback: ((data: MatchFoundData) => void) | null = null
  private onGameInvitationCallback: ((data: GameInvitationData) => void) | null = null
  private onInvitationDeclinedCallback: ((data: InvitationDeclinedData) => void) | null = null
  private onInvitationAcceptedCallback: ((data: InvitationAcceptedData) => void) | null = null
  private onGameUpdatedCallback: ((gameData: any) => void) | null = null
  private onRematchRequestCallback: ((data: any) => void) | null = null
  private onRematchAcceptedCallback: ((data: any) => void) | null = null
  private onRematchDeclinedCallback: ((data: any) => void) | null = null

  getConnection(): signalR.HubConnection | null {
    return this.connection
  }

  async initializeConnection(): Promise<void> {
    const token = authService.getToken()
    if (!token) {
      throw new Error("Non authentifié")
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/gamehub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build()

    this.connection.on("MatchFound", (data: MatchFoundData) => {
      console.log("Match trouvé !", data)
      if (this.onMatchFoundCallback) {
        this.onMatchFoundCallback(data)
      }
    })

    this.connection.on("GameInvitation", (data: GameInvitationData) => {
      console.log("⚠️ [SignalR] Événement GameInvitation REÇU !", data)
      if (this.onGameInvitationCallback) {
        console.log("✅ [SignalR] Callback GameInvitation exécuté")
        this.onGameInvitationCallback(data)
      } else {
        console.error("❌ [SignalR] Callback GameInvitation NON DÉFINI !")
      }
    })

    this.connection.on("InvitationDeclined", (data: InvitationDeclinedData) => {
      console.log("Invitation refusée !", data)
      if (this.onInvitationDeclinedCallback) {
        this.onInvitationDeclinedCallback(data)
      }
    })

    this.connection.on("InvitationAccepted", (data: InvitationAcceptedData) => {
      console.log("✅ Invitation acceptée !", data)
      if (this.onInvitationAcceptedCallback) {
        this.onInvitationAcceptedCallback(data)
      }
    })

    this.connection.on("GameUpdated", (gameData: any) => {
      console.log("🎮 Mise à jour du jeu reçue:", gameData)
      if (this.onGameUpdatedCallback) {
        this.onGameUpdatedCallback(gameData)
      }
    })

    this.connection.on("RematchRequest", (data: any) => {
      console.log("🔄 Demande de rematch reçue:", data)
      if (this.onRematchRequestCallback) {
        this.onRematchRequestCallback(data)
      }
    })

    this.connection.on("RematchAccepted", (data: any) => {
      console.log("✅ Rematch accepté:", data)
      if (this.onRematchAcceptedCallback) {
        this.onRematchAcceptedCallback(data)
      }
    })

    this.connection.on("RematchDeclined", (data: any) => {
      console.log("❌ Rematch refusé:", data)
      if (this.onRematchDeclinedCallback) {
        this.onRematchDeclinedCallback(data)
      }
    })

    try {
      await this.connection.start()
      console.log("SignalR connecté")
    } catch (err) {
      console.error("Erreur connexion SignalR:", err)
      throw err
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.connection.state !== "Disconnected") {
      console.log("🔌 Déconnexion SignalR...")
      await this.connection.stop()
    }
    this.connection = null
  }


  onRematchRequest(callback: (data: any) => void): void {
    this.onRematchRequestCallback = callback
  }

  onRematchAccepted(callback: (data: any) => void): void {
    this.onRematchAcceptedCallback = callback
  }

  onRematchDeclined(callback: (data: any) => void): void {
    this.onRematchDeclinedCallback = callback
  }
  onMatchFound(callback: (data: MatchFoundData) => void): void {
    this.onMatchFoundCallback = callback
  }

  onGameInvitation(callback: (data: GameInvitationData) => void): void {
    console.log("🔧 [SignalR] Configuration du callback GameInvitation")
    this.onGameInvitationCallback = callback
  }

  onInvitationDeclined(callback: (data: InvitationDeclinedData) => void): void {
    this.onInvitationDeclinedCallback = callback
  }

  onInvitationAccepted(callback: (data: InvitationAcceptedData) => void): void {
    console.log("🔧 [SignalR] Configuration du callback InvitationAccepted")
    this.onInvitationAcceptedCallback = callback
  }

  onGameUpdated(callback: (gameData: any) => void): void {
    this.onGameUpdatedCallback = callback
  }

  async joinMatchmaking(): Promise<{ status: string; message: string; gameId?: string }> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la recherche de partie')
    }

    return response.json()
  }

  async leaveMatchmaking(): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'annulation')
    }
  }

  async getStatus(): Promise<{ isSearching: boolean; playersInQueue: number }> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du statut')
    }

    return response.json()
  }

  async inviteFriend(friendId: string): Promise<{ gameId: string }> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/invite/${friendId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de l\'invitation')
    }

    return response.json()
  }

  async requestRematch(opponentId: string): Promise<{ gameId: string }> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/rematch/${opponentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la demande de rematch')
    }

    return response.json()
  }

  async acceptRematch(gameId: string): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/rematch/accept/${gameId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de l\'acceptation du rematch')
    }
  }

  async declineRematch(gameId: string): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/rematch/decline/${gameId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors du refus du rematch')
    }
  }

  async getPendingInvitations(): Promise<Array<{
    gameId: string
    inviterId: string
    inviterUsername: string
    invitedAt: string
  }>> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/invitations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des invitations')
    }

    return response.json()
  }

  async getSentInvitations(): Promise<Array<{
    gameId: string
    inviteeId: string
    inviteeUsername: string
    invitedAt: string
  }>> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/sent-invitations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des invitations envoyées')
    }

    return response.json()
  }

  async getActiveGames(): Promise<Array<{
    gameId: string
    opponentName: string
    opponentId: string
  }>> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/active-games`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des parties actives')
    }

    return response.json()
  }

  async declineInvitation(gameId: string): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/invitations/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors du refus de l\'invitation')
    }
  }

  async acceptInvitation(gameId: string): Promise<void> {
    const token = authService.getToken()
    const response = await fetch(`${BASE_URL}/api/matchmaking/invitations/${gameId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'acceptation de l\'invitation')
    }
  }
}

export const matchmakingService = new MatchmakingService()
