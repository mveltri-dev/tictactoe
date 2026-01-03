import type { LoginRequest, RegisterRequest, LoginResponse } from "../dtos"

const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || import.meta.env.VITE_API_AZURE_URL

class AuthService {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('token')
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  async register(username: string, email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Erreur lors de l\'inscription')
    }

    const data: LoginResponse = await response.json()
    this.setToken(data.token)
    return data
  }

  async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrUsername, password }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Erreur lors de la connexion')
    }

    const data: LoginResponse = await response.json()
    this.setToken(data.token)
    return data
  }

  logout() {
    this.clearToken()
  }
}

export const authService = new AuthService()
