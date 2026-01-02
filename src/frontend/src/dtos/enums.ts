// Types énumérés pour l'application

export type Symbol = "X" | "O"
export type GameModeAPI = "VsComputer" | "VsPlayerLocal" | "VsPlayerOnline" | "VsHuman" | "Online"
export type GameMode = "ai" | "local" | "friend"
export type GameStatus = "InProgress" | "XWins" | "OWins" | "Draw"
export type AppState = "configuration" | "loading" | "playing" | "finished" | "error"

