import { useState, useCallback, useEffect, useRef } from "react"
import { api } from "../services/api"
import { matchmakingService } from "../services/matchmakingService"
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
  loadGame: (gameId: string) => Promise<void>
  makeMove: (position: number, playerId: string) => Promise<void>
  resetGame: () => void
  updateConfig: (partialConfig: Partial<GameConfig>) => void
  changeGameMode: (mode: GameModeAPI) => void
  
  // Computed
  isGameOver: boolean
  currentPlayerSymbol: Symbol | null
}

export function useGame(onAutoRestarted?: (newGameId: string) => void): UseGameReturn {
  const [game, setGame] = useState<GameDTO | null>(null)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [appState, setAppState] = useState<AppState>("configuration")
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 })
  const autoRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousGameStatusRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Écouter les mises à jour SignalR pour les parties multijoueur
  useEffect(() => {
    if (config?.gameMode === "VsPlayerOnline") {
      console.log("🎮 Configuration de l'écoute SignalR pour les parties en ligne")
      
      const handleGameUpdate = (updatedGameData: any) => {
        console.log("🎮 Mise à jour reçue:", updatedGameData)
        setGame(prevGame => {
          // Ne mettre à jour que si c'est le même jeu
          if (prevGame && updatedGameData.id === prevGame.id) {
            console.log("✅ Mise à jour de l'état du jeu:", updatedGameData)
            return updatedGameData
          }
          return prevGame
        })
        setAppState("playing")
      }
      
      matchmakingService.onGameUpdated(handleGameUpdate)
      
      // Pas de cleanup car le callback est partagé globalement
    }
  }, [config?.gameMode])

  // Polling désactivé : SignalR gère les mises à jour en temps réel
  useEffect(() => {
    // Nettoyer si un polling était actif
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])


  // Déclaration de createGame AVANT le useEffect d'auto-restart

  // Auto-restart après fin de partie
  useEffect(() => {
    if (game && game.status !== "InProgress") {
      setAppState("finished")
      // Mettre à jour les scores SEULEMENT si le statut vient de changer
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
      // Auto-restart après 2 secondes SEULEMENT pour les modes locaux, sans flash (pas de passage par null ni loading)
      if (config?.gameMode !== "VsPlayerOnline") {
        autoRestartTimeoutRef.current = setTimeout(async () => {
          if (config) {
            // Pas de setAppState("loading") ni setGame(null) ici !
            const newGame = await createGame({
              player1Name: config.player1Name,
              player2Name: config.player2Name,
              chosenSymbol: config.chosenSymbol,
              gameMode: config.gameMode
            })
            if (newGame && onAutoRestarted) {
              onAutoRestarted(newGame.id)
            }
          }
        }, 2000)
      }
    }
    return () => {
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current)
      }
    }
  }, [game?.status, config, onAutoRestarted])

  const createGame = useCallback(async (request: CreateGameRequest): Promise<GameDTO | null> => {
    try {
      // Ne pas passer par 'loading' pour les parties locales afin d'éviter le flash
      setError(null)
      // Pour les parties locales, garder la config locale (noms, symbole)
      // Toujours initialiser la config locale (pour toutes les parties)
      const newConfig: GameConfig = {
        player1Name: request.player1Name || "Joueur 1",
        player2Name: request.player2Name || (request.gameMode === "VsComputer" ? "EasiBot" : "Joueur 2"),
        chosenSymbol: request.chosenSymbol,
        gameMode: request.gameMode
      }
      setConfig(newConfig)
      if (request.gameMode === "VsPlayerOnline") {
        setError(null)
        setAppState("loading")
      }
      const newGame = await api.createGame(request)
      setGame(newGame)
      previousGameStatusRef.current = "InProgress"
      setAppState("playing")

      // Si c'est une partie contre l'IA et que le joueur humain a choisi O, l'IA doit jouer en premier
      if (
        request.gameMode === "VsComputer" &&
        request.chosenSymbol === "O" &&
        newGame.currentTurn === "X"
      ) {
        // L'IA doit jouer tout de suite
        await new Promise(resolve => setTimeout(resolve, 1200))
        const gameAfterAi = await api.playAiMove(newGame.id)
        setGame(gameAfterAi)
        if (gameAfterAi.status !== "InProgress") {
          setAppState("finished")
        }
      }

      return newGame
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la partie")
      setAppState("error")
      return null
    }
  }, [])

  const loadGame = useCallback(async (gameId: string): Promise<void> => {
    try {
      setAppState("loading")
      setError(null)
      
      const loadedGame = await api.getGame(gameId)
      setGame(loadedGame)
      
      // Créer une config basée sur les données de la partie
      const playerXName = loadedGame.playerXName || "Joueur X"
      const playerOName = loadedGame.playerOName || "Joueur O"
      
      // Déterminer le symbole du joueur actuel pour les parties online
      let chosenSymbol: Symbol = "X" // Par défaut
      if (loadedGame.mode === "VsPlayerOnline") {
        // Pour les parties online, récupérer le userId du token
        const { authService } = await import("../services/authService")
        const userId = authService.getUserIdFromToken()
        
        if (userId) {
          // Comparer avec playerXId et playerOId
          if (userId === loadedGame.playerXId) {
            chosenSymbol = "X"
          } else if (userId === loadedGame.playerOId) {
            chosenSymbol = "O"
          }
          console.log('👤 UserId:', userId, '→ Symbole:', chosenSymbol)
        }
        
        // Initialiser SignalR si pas déjà connecté
        try {
          const connection = matchmakingService.getConnection()
          if (!connection || connection.state !== "Connected") {
            console.log("🔌 Initialisation de SignalR pour la partie en ligne...")
            await matchmakingService.initializeConnection()
            console.log("✅ SignalR connecté avec succès")
          } else {
            console.log("✅ SignalR déjà connecté")
          }
        } catch (signalrError) {
          console.error("❌ Erreur lors de l'initialisation SignalR:", signalrError)
          // Ne pas bloquer le chargement si SignalR échoue
        }
      }
      
      // Pour les parties locales, NE PAS écraser la config locale
      if (loadedGame.mode === "VsComputer" || loadedGame.mode === "VsPlayerLocal") {
        // Ne rien faire, garder la config locale
      } else {
        setConfig({
          player1Name: playerXName,
          player2Name: playerOName,
          chosenSymbol,
          gameMode: loadedGame.mode as GameModeAPI
        })
      }
      previousGameStatusRef.current = loadedGame.status
      setAppState(loadedGame.status === "InProgress" ? "playing" : "finished")
    } catch (err) {
      console.error('❌ Erreur dans loadGame:', err)
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de la partie")
      setAppState("error")
    }
  }, [])

  const makeMove = useCallback(async (position: number, playerId: string) => {
    if (!game || !config) return

    try {
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
      // 3. Tant que c'est à l'IA de jouer, enchaîner les coups IA (utile si l'IA doit jouer plusieurs fois de suite)
      let nextGame = updatedGame;
      while (
        nextGame.status === "InProgress" &&
        config.gameMode === "VsComputer" &&
        config.chosenSymbol !== nextGame.currentTurn
      ) {
        console.log('IA va jouer dans 1200ms...')
        await new Promise(resolve => setTimeout(resolve, 1200))
        console.log('IA joue maintenant, gameId:', nextGame.id)
        nextGame = await api.playAiMove(nextGame.id)
        setGame(nextGame)
      }
      if (nextGame.status !== "InProgress") {
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
    loadGame,
    makeMove,
    resetGame,
    updateConfig,
    changeGameMode,
    isGameOver,
    currentPlayerSymbol
  }
}


