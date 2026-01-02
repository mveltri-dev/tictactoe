import { useState, useEffect } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useGame } from "../hooks"
import { GameLayout } from "../components/templates"
import { GameConfiguration, GamePlaying, GameModeSelector } from "../components/organisms"
import { LoginForm } from "../components/molecules"
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
  const {
    game,
    config,
    appState,
    error,
    scores,
    createGame,
    makeMove,
    resetGame,
    changeGameMode
  } = useGame()

  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [language, setLanguage] = useState("fr")
  const [gameMode, setGameMode] = useState<GameModeAPI>("VsComputer")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)

  // Auto-créer une partie par défaut lors du premier chargement ou refresh
  useEffect(() => {
    // Si on est sur /game/:id mais qu'il n'y a pas de partie, rediriger vers la configuration
    if (location.pathname.startsWith('/game/') && !game && appState === "configuration") {
      navigate('/')
    }
  }, [location.pathname, game, appState, navigate])

  // Quand on change de mode de jeu, rediriger vers la configuration
  const handleGameModeChange = async (mode: GameMode) => {
    const apiMode = mapLocalToApiMode(mode)
    setGameMode(apiMode)
    changeGameMode(apiMode)
    
    // Rediriger vers la page de configuration pour tous les modes
    navigate('/')
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
    
    const playerId = game.currentTurn === config.chosenSymbol 
      ? (config.chosenSymbol === "X" ? game.playerXId : game.playerOId)
      : (game.currentTurn === "X" ? game.playerXId : game.playerOId)
    
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

  const handleLogin = () => {
    setIsLoggedIn(true)
    setShowLoginForm(false)
  }

  const isInGame = !!game

  return (
    <GameLayout
      isSoundEnabled={isSoundEnabled}
      onSoundToggle={() => setIsSoundEnabled(!isSoundEnabled)}
      language={language}
      onLanguageChange={setLanguage}
    >
      {/* Game Mode Selector - Fixed Top Right */}
      <div className={styles.mode_selector_container}>
        <GameModeSelector
          currentMode={mapApiToLocalMode(gameMode)}
          onSelectMode={handleGameModeChange}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setShowLoginForm(true)}
        />
      </div>

      {/* Login Form Modal */}
      <AnimatePresence>
        {showLoginForm && (
          <LoginForm
            onClose={() => setShowLoginForm(false)}
            onLogin={handleLogin}
          />
        )}
      </AnimatePresence>

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

        {/* Page de jeu */}
        <Route path="/game/:id" element={
          <>
            {game && config && (appState === "playing" || appState === "finished" || appState === "loading") && (
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


