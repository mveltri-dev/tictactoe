import { useState, useCallback, useEffect, useRef } from "react"
import { api } from "../services/api"
import { matchmakingService } from "../services/matchmakingService"
import { authService } from "../services/authService"
import type { GameDTO, CreateGameRequest, AppState, Symbol, GameModeAPI } from "../dtos"

interface GameConfig {
  player1Name: string
  player2Name: string
  chosenSymbol: Symbol
  gameMode: GameModeAPI
  width: number
  height: number
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
  // DEBUG: log à chaque changement de scores
  useEffect(() => {
    console.log('[DEBUG][Scores] Scores actuels :', scores)
  }, [scores])
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
      // Incrémenter les scores uniquement si la partie précédente existe vraiment (éviter après reset)
      if (previousGameStatusRef.current === "InProgress" && game) {
        if (game.status === "XWins") {
          console.log('[DEBUG][SCORES] Incrément X (victoire X)')
          setScores(prev => ({ ...prev, X: prev.X + 1 }))
        } else if (game.status === "OWins") {
          console.log('[DEBUG][SCORES] Incrément O (victoire O)')
          setScores(prev => ({ ...prev, O: prev.O + 1 }))
        } else if (game.status === "Draw") {
          console.log('[DEBUG][SCORES] Incrément Draw (match nul)')
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }))
        }
      }
      previousGameStatusRef.current = game.status
      // Auto-restart après 2 secondes SEULEMENT pour les modes locaux, sans flash (pas de passage par null ni loading)
      if (config?.gameMode !== "VsPlayerOnline") {
        autoRestartTimeoutRef.current = setTimeout(async () => {
          if (config) {
            // Inclure la taille du plateau pour la nouvelle partie
            const newGame = await createGame({
              player1Name: config.player1Name,
              player2Name: config.player2Name,
              chosenSymbol: config.chosenSymbol,
              gameMode: config.gameMode,
              width: config.width,
              height: config.height
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
      setError(null)
      // Toujours initialiser la config locale (pour toutes les parties)
      const newConfig: GameConfig = {
        player1Name: request.player1Name || "Joueur 1",
        player2Name: request.player2Name || (request.gameMode === "VsComputer" ? "EasiBot" : "Joueur 2"),
        chosenSymbol: request.chosenSymbol,
        gameMode: request.gameMode,
        width: request.width ?? 3,
        height: request.height ?? 3
      }
      setConfig(newConfig)
      // Toujours reset les scores pour toute nouvelle partie en ligne (matchmaking), même si c'est le même match
      if (request.gameMode === "VsPlayerOnline") {
        console.log('[DEBUG][createGame] RESET SCORES pour nouvelle partie en ligne (matchmaking)')
        setScores({ X: 0, O: 0, draws: 0 })
        previousGameStatusRef.current = null
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
      // Pour le mode online, ne jamais fallback sur 'Joueur X' ou 'Joueur O' si le nom n'est pas fourni
      const playerXName = loadedGame.mode === "VsPlayerOnline"
        ? (loadedGame.playerXName || "?")
        : (loadedGame.playerXName || "Joueur X")
      const playerOName = loadedGame.mode === "VsPlayerOnline"
        ? (loadedGame.playerOName || "?")
        : (loadedGame.playerOName || "Joueur O")
      
      // Déterminer le symbole du joueur actuel pour les parties online
      let chosenSymbol: Symbol = "X" // Par défaut
      if (loadedGame.mode === "VsPlayerOnline") {
        // Pour les parties online, récupérer le userId du token
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
      // Correction : toujours forcer la cohérence du mode de jeu dans la config
      setConfig((prev) => {
        // Si la config locale n'existe pas ou n'est pas cohérente avec la partie chargée, on la remplace
        if (!prev || prev.gameMode !== loadedGame.mode) {
          return {
            player1Name: playerXName,
            player2Name: playerOName,
            chosenSymbol,
            gameMode: loadedGame.mode as GameModeAPI,
            width: loadedGame.width ?? 3,
            height: loadedGame.height ?? 3
          }
        }
        // Sinon, on met juste à jour la taille du plateau si besoin
        return {
          ...prev,
          width: loadedGame.width ?? prev.width ?? 3,
          height: loadedGame.height ?? prev.height ?? 3
        }
      })
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
    // Toujours reset les scores, même si on revient au lobby ou qu'on change de mode
    setScores({ X: 0, O: 0, draws: 0 })
    setGame(null)
    setConfig(null)
    setAppState("configuration")
    setError(null)
    previousGameStatusRef.current = null
  }, [])

  const updateConfig = useCallback((partialConfig: Partial<GameConfig>) => {
    setConfig(prev => prev ? { ...prev, ...partialConfig } : null)
  }, [])

  const changeGameMode = useCallback((mode: GameModeAPI) => {
    setConfig(prev => prev ? { ...prev, gameMode: mode } : null)
    // On force le reset complet (scores inclus) à chaque changement de mode
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


