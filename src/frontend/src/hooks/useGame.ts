import { useState, useCallback, useEffect, useRef } from "react"
import { api } from "../services/api"
import type { GameDTO, CreateGameRequest, AppState, Symbol, GameModeAPI } from "../dtos"

interface GameConfig {
  player1Name: string
  player2Name: string
  chosenSymbol: Symbol
  gameMode: GameModeAPI
}

interface Scores {
  X: number
  O: number
  draws: number
}

interface UseGameReturn {
  // State
  game: GameDTO | null
  config: GameConfig | null
  appState: AppState
  error: string | null
  scores: Scores
  
  // Actions
  createGame: (config: CreateGameRequest) => Promise<GameDTO | null>
  makeMove: (position: number, playerId: string) => Promise<void>
  resetGame: () => void
  updateConfig: (partialConfig: Partial<GameConfig>) => void
  changeGameMode: (mode: GameModeAPI) => void
  
  // Computed
  isGameOver: boolean
  currentPlayerSymbol: Symbol | null
}

export function useGame(): UseGameReturn {
  const [game, setGame] = useState<GameDTO | null>(null)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [appState, setAppState] = useState<AppState>("configuration")
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 })
  const autoRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousGameStatusRef = useRef<string | null>(null)

  // Auto-restart après fin de partie
  useEffect(() => {
    if (game && game.status !== "InProgress") {
      setAppState("finished")
      
      // Mettre à jour les scores SEULEMENT si le statut vient de changer
      // (évite de compter 2 fois quand setGame est appelé plusieurs fois)
      if (previousGameStatusRef.current === "InProgress" || previousGameStatusRef.current === null) {
        if (game.status === "XWins") {
          setScores(prev => ({ ...prev, X: prev.X + 1 }))
        } else if (game.status === "OWins") {
          setScores(prev => ({ ...prev, O: prev.O + 1 }))
        } else if (game.status === "Draw") {
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }))
        }
      }
      previousGameStatusRef.current = game.status

      // Auto-restart après 2 secondes
      autoRestartTimeoutRef.current = setTimeout(() => {
        if (config) {
          setAppState("loading")
          setTimeout(() => {
            createGame({
              player1Name: config.player1Name,
              player2Name: config.player2Name,
              chosenSymbol: config.chosenSymbol,
              gameMode: config.gameMode
            })
          }, 500)
        }
      }, 2000)
    }

    return () => {
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current)
      }
    }
  }, [game?.status, config])

  const createGame = useCallback(async (request: CreateGameRequest): Promise<GameDTO | null> => {
    try {
      setAppState("loading")
      setError(null)
      
      // Sauvegarder la config locale (pour les noms)
      const newConfig: GameConfig = {
        player1Name: request.player1Name || "Joueur 1",
        player2Name: request.player2Name || (request.gameMode === "VsComputer" ? "EasiBot" : "Joueur 2"),
        chosenSymbol: request.chosenSymbol,
        gameMode: request.gameMode
      }
      setConfig(newConfig)
      
      const newGame = await api.createGame(request)
      setGame(newGame)
      previousGameStatusRef.current = "InProgress"
      setAppState("playing")
      return newGame
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la partie")
      setAppState("error")
      return null
    }
  }, [])

  const makeMove = useCallback(async (position: number, playerId: string) => {
    if (!game || !config) return

    try {
      setAppState("loading")
      setError(null)
      
      // 1. Faire le coup du joueur
      const updatedGame = await api.makeMove({
        gameId: game.id,
        playerId,
        position
      })
      
      // 2. Afficher immédiatement le coup du joueur
      setGame(updatedGame)
      setAppState("playing")
      
      // 3. Si la partie continue et c'est le mode IA, attendre puis faire jouer l'IA
      if (updatedGame.status === "InProgress" && config.gameMode === "VsComputer") {
        console.log('IA va jouer dans 1200ms...')
        // Attendre 1200ms pour que l'utilisateur voie son coup
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        console.log('IA joue maintenant, gameId:', updatedGame.id)
        // Déclencher le coup de l'IA
        const gameAfterAi = await api.playAiMove(updatedGame.id)
        setGame(gameAfterAi)
        
        // Vérifier si la partie est terminée après le coup de l'IA
        if (gameAfterAi.status !== "InProgress") {
          setAppState("finished")
        }
      } else if (updatedGame.status !== "InProgress") {
        setAppState("finished")
      }
    } catch (err) {
      console.error('Erreur dans makeMove:', err)
      setError(err instanceof Error ? err.message : "Erreur lors du coup")
      setAppState("playing")
    }
  }, [game, config])

  const resetGame = useCallback(() => {
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current)
    }
    setGame(null)
    setConfig(null)
    setAppState("configuration")
    setError(null)
    setScores({ X: 0, O: 0, draws: 0 })
    previousGameStatusRef.current = null
  }, [])

  const updateConfig = useCallback((partialConfig: Partial<GameConfig>) => {
    setConfig(prev => prev ? { ...prev, ...partialConfig } : null)
  }, [])

  const changeGameMode = useCallback((mode: GameModeAPI) => {
    setConfig(prev => prev ? { ...prev, gameMode: mode } : null)
    resetGame()
  }, [resetGame])

  const isGameOver = game?.status !== "InProgress"
  const currentPlayerSymbol = game?.currentTurn || null

  return {
    game,
    config,
    appState,
    error,
    scores,
    createGame,
    makeMove,
    resetGame,
    updateConfig,
    changeGameMode,
    isGameOver,
    currentPlayerSymbol
  }
}


