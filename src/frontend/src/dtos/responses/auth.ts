export interface UserDTO {
  id: string
  username: string
  email: string
  createdAt: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: UserDTO
}

export interface RoomDTO {
  id: string
  name: string
  code: string
  hostUsername: string
  guestUsername: string | null
  status: string
  gameId: string | null
  createdAt: string
  updatedAt: string
}
