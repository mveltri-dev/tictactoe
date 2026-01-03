import { useState, useEffect } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useGame } from "../hooks"
import { GameLayout } from "../components/templates"
import { GameConfiguration, GamePlaying, GameModeSelector, OnlineHub } from "../components/organisms"
import { LoginForm } from "../components/molecules"
import { authService } from "../services/authService"
import type { CreateGameRequest, GameModeAPI } from "../dtos"
import styles from "./App.module.css"

// Map GameModeAPI to GameMode type for selector
type GameMode = "ai" | "local" | "friend"

const mapApiToLocalMode = (apiMode: GameModeAPI): GameMode => {
  switch(apiMode) {
    case "VsComputer": return "ai"
    case "VsPlayerLocal": return "local"
    case "VsPlayerOnline": return "friend"
    default: return "ai"
  }
}

const mapLocalToApiMode = (localMode: GameMode): GameModeAPI => {
  switch(localMode) {
    case "ai": return "VsComputer"
    case "local": return "VsPlayerLocal"
    case "friend": return "VsPlayerOnline"
    default: return "VsComputer"
  }
}

export function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [language, setLanguage] = useState("fr")
  const [gameMode, setGameMode] = useState<GameModeAPI>("VsComputer")
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  // Ajout : navigation automatique après auto-restart local
  type UseGameHook = typeof useGame
  const useGameWithRestartNav: UseGameHook = (onAutoRestarted) => useGame(onAutoRestarted)

  // Utilisation du hook avec navigation
  const {
    game,
    config,
    appState,
    error,
    scores,
    createGame,
    loadGame,
    makeMove,
    resetGame,
    changeGameMode
  } = useGameWithRestartNav((newGameId) => {
    if (location.pathname.startsWith('/game/')) {
      navigate(`/game/${newGameId}`)
    }
  })

  // Charger une partie existante si on accède à /game/:id
  useEffect(() => {
    const match = location.pathname.match(/^\/game\/([^/]+)$/)
    if (match) {
      const gameId = match[1]
      // Ne charger que si on n'a pas déjà cette partie
      if (!game || game.id !== gameId) {
        loadGame(gameId)
      }
    }
  }, [location.pathname, game, loadGame])

  // Si on est sur /game/:id mais qu'il y a une erreur de chargement, rediriger vers la configuration
  useEffect(() => {
    if (location.pathname.startsWith('/game/') && !game && appState === "error") {
      console.log('⚠️ Redirection vers / car erreur de chargement de la partie')
      navigate('/')
    }
  }, [location.pathname, game, appState, navigate])

  // Quand on change de mode de jeu, rediriger vers la configuration
  const handleGameModeChange = async (mode: GameMode) => {
    const apiMode = mapLocalToApiMode(mode)
    setGameMode(apiMode)
    
    // Si mode online, gérer l'authentification
    if (apiMode === "VsPlayerOnline") {
      if (!token) {
        // Pas de token, rediriger vers login SANS changer le mode dans useGame
        console.log('Redirection vers /login car pas de token')
        navigate('/login')
        return // Sortir immédiatement
      } else {
        // Token présent, aller au lobby
        console.log('Redirection vers /lobby car token présent')
        navigate('/lobby')
        return // Sortir immédiatement
      }
    }
    
    // Pour les modes local et bot : changer le mode dans useGame
    changeGameMode(apiMode)
    
    // Rester sur la page de configuration
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleLoginSubmit = async (username: string, password: string) => {
    const response = await authService.login(username, password)
    setToken(response.token)
    navigate('/lobby')
  }

  const handleLogin = (userToken: string) => {
    setToken(userToken)
    localStorage.setItem('token', userToken)
    navigate('/lobby')
  }

  const handleLogout = () => {
    authService.logout()
    setToken(null)
    navigate('/')
  }

  const handleGameFound = (gameId: string, opponentUsername: string, yourSymbol: "X" | "O") => {
    console.log('🎯 Match trouvé !', { gameId, opponentUsername, yourSymbol })
    console.log('🔄 Navigation vers /game/' + gameId)
    navigate(`/game/${gameId}`)
    console.log('✅ Navigate appelé, pathname devrait changer')
  }

  const handleStartGameAuto = async (mode: GameModeAPI, symbol: "X" | "O") => {
    const newGame = await createGame({
      player1Name: "Joueur 1",
      player2Name: mode === "VsComputer" ? "EasiBot" : "Joueur 2",
      chosenSymbol: symbol,
      gameMode: mode
    })
    if (newGame) {
      navigate(`/game/${newGame.id}`)
    }
  }

  const handleStartGame = async (request: CreateGameRequest) => {
    const newGame = await createGame(request)
    if (newGame) {
      navigate(`/game/${newGame.id}`)
    }
  }

  const handleCellClick = async (position: number) => {
    if (!game || !config) return
    
    // Utiliser le playerId correspondant au symbole actuel (currentTurn)
    const playerId = game.currentTurn === "X" ? game.playerXId : game.playerOId
    
    console.log('🎯 Coup joué:', { position, currentTurn: game.currentTurn, playerId })
    await makeMove(position, playerId)
  }

  const handleNewGame = () => {
    resetGame()
    navigate('/')
  }

  const handleRestart = async () => {
    if (config) {
      const newGame = await createGame({
        player1Name: config.player1Name,
        player2Name: config.player2Name,
        chosenSymbol: config.chosenSymbol,
        gameMode: config.gameMode
      })
      if (newGame) {
        navigate(`/game/${newGame.id}`)
      }
    }
  }

  const isInGame = !!game

  return (
    <GameLayout
      isSoundEnabled={isSoundEnabled}
      onSoundToggle={() => setIsSoundEnabled(!isSoundEnabled)}
      language={language}
      onLanguageChange={setLanguage}
    >
      {/* Affichage du jeu pour les parties en cours */}
      {game && config && (appState === "playing" || (appState === "finished" && location.pathname.startsWith('/game/'))) && appState !== "loading" && location.pathname.startsWith('/game/') && (
        <div className={styles.content_container}>
          <GamePlaying
            game={game}
            config={config}
            appState={appState}
            error={error}
            scores={scores}
            onCellClick={handleCellClick}
            onNewGame={handleNewGame}
            onRestart={handleRestart}
          />
        </div>
      )}

      {/* Écran de chargement dédié pour le restart automatique */}
      {appState === "loading" && location.pathname.startsWith('/game/') && (
        <div className={styles.loading_container}>
          <div className={styles.loading__spinner} />
          <p className={styles.loading__text}>Nouvelle partie...</p>
        </div>
      )}

      {/* Game Mode Selector - Fixed Top Right */}
      <div className={styles.mode_selector_container}>
        <GameModeSelector
          currentMode={mapApiToLocalMode(gameMode)}
          onSelectMode={handleGameModeChange}
        />
      </div>

      <Routes>
        {/* Page d'accueil - Configuration */}
        <Route path="/" element={
          <>
            {appState === "loading" && !game && (
              <div className={styles.loading_container}>
                <div className={styles.loading_spinner} />
                <p className={styles.loading_text}>Préparation de la partie contre EasiBot...</p>
              </div>
            )}

            {appState === "configuration" && (
              <div className={styles.content_container}>
                <GameConfiguration
                  gameMode={gameMode}
                  onStartGame={handleStartGame}
                />
              </div>
            )}

            {appState === "error" && !game && error && (
              <div className={styles.error_container}>
                <h2 className={styles.error_title}>Erreur</h2>
                <p className={styles.error_message}>{error}</p>
                <button 
                  onClick={resetGame} 
                  className={styles.button}
                >
                  Retour à la configuration
                </button>
              </div>
            )}
          </>
        } />

        {/* Page de login (uniquement pour le mode online) */}
        <Route path="/login" element={
          <div className={styles.content_container}>
            <LoginForm onLogin={handleLoginSubmit} onClose={() => navigate('/')} />
          </div>
        } />

        {/* Page de lobby (nécessite authentification) */}
        <Route path="/lobby" element={
          token ? (
            <div className={styles.content_container}>
              <OnlineHub 
                onLogout={handleLogout}
                onStartMatchmaking={() => console.log('Matchmaking')}
                onGameFound={handleGameFound}
              />
            </div>
          ) : (
            <div className={styles.content_container}>
              <p>Vous devez être connecté pour accéder au lobby.</p>
              <button onClick={() => navigate('/login')} className={styles.button}>
                Se connecter
              </button>
            </div>
          )
        } />

        {/* Page de jeu */}
        <Route path="/game/:id" element={
          <>
            {appState === "loading" && !game && (
              <div className={styles.loading_container}>
                <div className={styles.loading_spinner} />
                <p className={styles.loading_text}>Chargement de la partie...</p>
              </div>
            )}

            {!game && appState === "error" && (
              <div className={styles.error_container}>
                <h2 className={styles["error_title--neutral"]}>Partie introuvable</h2>
                <p className={styles.error_message}>Cette partie n'existe pas ou a été supprimée.</p>
                <button 
                  onClick={handleNewGame} 
                  className={styles.button}
                >
                  Nouvelle partie
                </button>
              </div>
            )}
          </>
        } />
      </Routes>
    </GameLayout>
  )
}


