import { useState, useEffect, useRef } from "react"
import { useToast } from "../components/organisms/toast/toast"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useGame } from "../hooks"
import { GameLayout } from "../components/templates"
import { GameConfiguration, GamePlaying, OnlineHub } from "../components/organisms"
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
  const { showError, showSuccess, showInfo } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [language, setLanguage] = useState("fr")
  const [gameMode, setGameMode] = useState<GameModeAPI>("VsComputer")
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  // Flag pour ignorer le chargement de partie après un changement de mode
  const ignoreNextLoadRef = useRef(false)


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
      if (ignoreNextLoadRef.current) {
        console.log('[App] Ignorer le chargement de partie suite à un changement de mode')
        ignoreNextLoadRef.current = false
        return
      }
      const gameId = match[1]
      // Ne charger que si on n'a pas déjà cette partie
      if (!game || game.id !== gameId) {
        loadGame(gameId)
      }
    }
  }, [location.pathname, game, loadGame])

  // Afficher un toast d'erreur global si une erreur d'app survient
  useEffect(() => {
    if (appState === "error" && error) {
      showError(error)
    }
  }, [appState, error, showError])

  // Si on est sur /game/:id mais qu'il y a une erreur de chargement, rediriger vers la configuration
  useEffect(() => {
    if (location.pathname.startsWith('/game/') && !game && appState === "error") {
      console.log('⚠️ Redirection vers / car erreur de chargement de la partie')
      navigate('/')
    }
  }, [location.pathname, game, appState, navigate])

  // Quand on change de mode de jeu, rediriger vers la configuration
  const handleGameModeChange = (mode: GameMode) => {
    const apiMode = mapLocalToApiMode(mode)
    console.log('[handleGameModeChange] mode:', mode, '| apiMode:', apiMode)
    setGameMode(apiMode)

    // Si mode online, gérer l'authentification
    if (apiMode === "VsPlayerOnline") {
      if (!token) {
        console.log('[handleGameModeChange] Redirection vers /login car pas de token')
        navigate('/login')
        return
      } else {
        console.log('[handleGameModeChange] Redirection vers /lobby car token présent')
        navigate('/lobby')
        return
      }
    }

    // Pour les modes local et bot : changer le mode dans useGame
    console.log('[handleGameModeChange] Changement de mode dans useGame')
    changeGameMode(apiMode)
    console.log('[handleGameModeChange] Path actuel:', location.pathname)
    if (location.pathname.startsWith('/game/') || location.pathname !== '/') {
      console.log('[handleGameModeChange] Navigation vers / puis reset du jeu')
      ignoreNextLoadRef.current = true
      navigate('/')
      setTimeout(() => {
        resetGame()
      }, 0)
    } else {
      console.log('[handleGameModeChange] Déjà sur /, reset du jeu et remount forcé')
      resetGame()
    }
  }

  const handleLoginSubmit = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password)
      setToken(response.token)
      showSuccess("Connexion réussie !")
      navigate('/lobby')
    } catch (err: any) {
      // Traduction des erreurs techniques en messages utilisateurs
      let message = "Erreur de connexion. Veuillez réessayer."
      if (err && typeof err === 'object') {
        const raw = err.error || err.message || (typeof err === 'string' ? err : '')
        if (typeof raw === 'string') {
          if (raw.toLowerCase().includes('incorrect')) {
            message = "Email ou mot de passe incorrect."
          } else if (raw.toLowerCase().includes('network')) {
            message = "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
          } else if (raw.toLowerCase().includes('timeout')) {
            message = "Le serveur met trop de temps à répondre. Réessayez plus tard."
          } else if (raw.toLowerCase().includes('jwt')) {
            message = "Session expirée. Veuillez vous reconnecter."
          }
        }
      }
      showError(message)
    }
  }

  const handleLogin = (userToken: string) => {
    setToken(userToken)
    localStorage.setItem('token', userToken)
    navigate('/lobby')
  }

  const handleLogout = () => {
    authService.logout()
    setToken(null)
    setGameMode('VsPlayerOnline')
    showInfo("Déconnexion réussie.")
    navigate('/login')
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
    const newGame = await createGame({
      ...request,
      width: 3,
      height: 3
    })
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

  // Pour passage à GameHeader
  const onSelectMode = (mode: GameMode) => {
    handleGameModeChange(mode)
  }

  return (
    <GameLayout
      isSoundEnabled={isSoundEnabled}
      onSoundToggle={() => setIsSoundEnabled(!isSoundEnabled)}
      language={language}
      onLanguageChange={setLanguage}
      currentMode={mapApiToLocalMode(gameMode)}
      onSelectMode={onSelectMode}
    >
      {/* Affichage du jeu pour les parties en cours */}
      {game && config && (appState === "playing" || (appState === "finished" && location.pathname.startsWith('/game/'))) && location.pathname.startsWith('/game/') && (
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
            modeLabel={config?.gameMode || gameMode}
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
                  key={gameMode} // force le remount à chaque changement de mode
                  gameMode={gameMode}
                  onStartGame={handleStartGame}
                />
              </div>
            )}

            {appState === "error" && !game && error && (
              // L'affichage d'erreur sera remplacé par un toast
              null
            )}
          </>
        } />

        {/* Page de login (uniquement pour le mode online) */}
        <Route path="/login" element={
          <div className={styles.content_container}>
            <LoginForm onLogin={handleLoginSubmit} onClose={() => { setGameMode('VsComputer'); navigate('/'); }} />
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
              // L'affichage d'erreur sera remplacé par un toast
              null
            )}
          </>
        } />
      </Routes>
    </GameLayout>
  )
}



