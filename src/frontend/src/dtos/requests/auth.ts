export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface JoinRoomRequest {
  code: string
}

export interface CreateRoomRequest {
  name: string
}
