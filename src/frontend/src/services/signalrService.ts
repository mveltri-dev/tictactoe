import * as signalR from '@microsoft/signalr'
import type { RoomDTO, GameDTO } from '../dtos'
import { authService } from './authService'

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

type GameEventCallbacks = {
  onPlayerJoinedRoom?: (room: RoomDTO) => void
  onGameStarted?: (room: RoomDTO) => void
  onMovePlayed?: (game: GameDTO) => void
  onGameEnded?: (game: GameDTO) => void
  onRoomClosed?: (roomId: string) => void
}

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private callbacks: GameEventCallbacks = {}

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    const token = authService.getToken()
    if (!token) {
      throw new Error('Authentification requise pour SignalR')
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/gamehub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build()

    // Enregistrer les handlers
    this.connection.on('PlayerJoinedRoom', (room: RoomDTO) => {
      console.log('SignalR: PlayerJoinedRoom', room)
      this.callbacks.onPlayerJoinedRoom?.(room)
    })

    this.connection.on('GameStarted', (room: RoomDTO) => {
      console.log('SignalR: GameStarted', room)
      this.callbacks.onGameStarted?.(room)
    })

    this.connection.on('MovePlayed', (game: GameDTO) => {
      console.log('SignalR: MovePlayed', game)
      this.callbacks.onMovePlayed?.(game)
    })

    this.connection.on('GameEnded', (game: GameDTO) => {
      console.log('SignalR: GameEnded', game)
      this.callbacks.onGameEnded?.(game)
    })

    this.connection.on('RoomClosed', (roomId: string) => {
      console.log('SignalR: RoomClosed', roomId)
      this.callbacks.onRoomClosed?.(roomId)
    })

    await this.connection.start()
    console.log('SignalR connecté')
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }
  }

  setCallbacks(callbacks: GameEventCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  async joinRoomGroup(roomCode: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinRoom', roomCode)
    }
  }

  async leaveRoomGroup(roomCode: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveRoom', roomCode)
    }
  }

  async joinGameGroup(gameId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinGame', gameId)
    }
  }

  async leaveGameGroup(gameId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveGame', gameId)
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

export const signalrService = new SignalRService()
