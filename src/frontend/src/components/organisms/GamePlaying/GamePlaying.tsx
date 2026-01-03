import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
// Le fichier global.d.ts est automatiquement inclus par TypeScript s'il est dans src/types ou référencé dans tsconfig.json
import { useToast } from "../toast/toast"
import type { GameDTO, GameModeAPI, Symbol, AppState } from "../../../dtos"
import { GameBoard } from "../GameBoard/GameBoard"
import { StatusDisplay } from "../../molecules"
import { ScoreBadge, GameButton } from "../../atoms"
import { GameControls } from "../../molecules"
import { Home, RotateCcw, Clock } from "lucide-react"
import { LogOut } from "lucide-react"
import { matchmakingService, MatchmakingService } from "../../../services/matchmakingService"
const mmService: MatchmakingService = matchmakingService
// @ts-ignore
import { authService } from "../../../services/authService"
import styles from "./GamePlaying.module.css"

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

interface GamePlayingProps {
  game: GameDTO
  config: GameConfig
  appState: AppState
  error: string | null
  scores: Scores
  onCellClick: (position: number) => void
  onNewGame: () => void
  onRestart: () => void
  modeLabel?: GameModeAPI
}

// Map API mode to local mode
type GameMode = "ai" | "local" | "friend"
const mapApiMode = (apiMode: GameModeAPI): GameMode => {
  switch(apiMode) {
    case "VsComputer": return "ai"
    case "VsPlayerLocal": return "local"
    case "VsPlayerOnline": return "friend"
    default: return "ai"
  }
}

console.log('[DEBUG] GamePlaying.tsx chargé')

export function GamePlaying({
  game,
  config,
  appState,
  error,
  scores,
  onCellClick,
  onNewGame,
  onRestart,
  modeLabel
}: GamePlayingProps) {
  // Initialiser la connexion SignalR si absente
  useEffect(() => {
    if (!mmService.getConnection()) {
      console.log('[DEBUG] Initialisation de la connexion SignalR (auto)')
      mmService.initializeConnection().then(() => {
        console.log('[DEBUG] Connexion SignalR initialisée')
      }).catch((err) => {
        console.error('[DEBUG] Erreur initialisation SignalR', err)
      })
    }
  }, [])

  // Gestion de l'abandon de partie en ligne
  const [isForfeiting, setIsForfeiting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  // Pour simuler le clic sur le mode dans la liste déroulante
  const handleForfeit = async () => {
    setShowConfirm(false)
    console.log('[DEBUG][GamePlaying] handleForfeit appelé, mode:', config.gameMode)
    if (config.gameMode === "VsPlayerOnline" && game.id) {
      setIsForfeiting(true)
      try {
        const userIdRaw = authService.getUserIdFromToken()
        const userId = userIdRaw ?? ""
        await mmService.forfeitGame(game.id, userId)
        console.log('[DEBUG][GamePlaying] navigate /lobby après forfeit online')
        navigate("/lobby")
      } catch (err: any) {
        showError(err.message || "Erreur lors de l'abandon de la partie")
      } finally {
        setIsForfeiting(false)
      }
    } else {
      console.log('[DEBUG][GamePlaying] onNewGame appelé depuis handleForfeit')
      onNewGame();
    }
  }
  // Appel à JoinGame dès que la connexion SignalR est prête
  useEffect(() => {
    const conn = mmService.getConnection()
    if (
      config.gameMode === "VsPlayerOnline" &&
      game.id &&
      conn &&
      conn.state === "Connected"
    ) {
      console.log('[DEBUG SignalR] Appel JoinGame (connexion) sur le hub pour gameId:', game.id)
      conn.invoke("JoinGame", game.id)
    } else {
      console.log('[DEBUG SignalR] JoinGame (connexion) NON appelé (état)', { gameId: game.id, mode: config.gameMode, connState: conn?.state })
    }
  }, [game.id, config.gameMode, mmService.getConnection()])
  console.log('[DEBUG] GamePlaying monté, gameId:', game.id, 'mode:', config.gameMode)
  const navigate = useNavigate()
  const [rematchStatus, setRematchStatus] = useState<'idle' | 'waiting' | 'opponent-waiting' | 'opponent-left'>('idle')
  const { showError } = useToast()
  const [pendingGameId, setPendingGameId] = useState<string | null>(null)
  // Appel à JoinGame au montage du composant
  useEffect(() => {
    console.log('[DEBUG SignalR] useEffect JoinGame (montage) déclenché', { gameId: game.id, mode: config.gameMode, conn: mmService.getConnection() })
    if (config.gameMode === "VsPlayerOnline" && game.id && mmService.getConnection()) {
      console.log('[DEBUG SignalR] Appel JoinGame (montage) sur le hub pour gameId:', game.id)
      mmService.getConnection()?.invoke("JoinGame", game.id)
    }
  }, [])

  // S'assurer que le joueur rejoint le groupe SignalR de la partie
  useEffect(() => {
    let joined = false
    let intervalId: NodeJS.Timeout | null = null
    function tryJoinGame() {
      const conn = mmService.getConnection()
      console.log('[DEBUG SignalR] tryJoinGame', { gameId: game.id, mode: config.gameMode, connState: conn?.state })
      if (
        config.gameMode === "VsPlayerOnline" &&
        game.id &&
        conn &&
        conn.state === "Connected" &&
        !joined
      ) {
        console.log('[DEBUG SignalR] Appel JoinGame sur le hub pour gameId:', game.id)
        conn.invoke("JoinGame", game.id)
        joined = true
        if (intervalId) clearInterval(intervalId)
      }
    }
    intervalId = setInterval(tryJoinGame, 500)
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])
  
  // Réinitialiser les états du rematch quand la partie change
  useEffect(() => {
    console.log('[DEBUG] useEffect rematch reset exécuté', { gameId: game.id })
    setRematchStatus('idle')
    setPendingGameId(null)
  }, [game.id])

  useEffect(() => {
    console.log('[DEBUG] useEffect rematch events exécuté', { gameId: game.id, mode: config.gameMode })
    if (config.gameMode !== "VsPlayerOnline" || game.status === "InProgress") return
    
    const userId = authService.getUserIdFromToken()
    const opponentId = userId === game.playerXId ? game.playerOId : game.playerXId
    
    // Écouter OpponentLeft
    mmService.onOpponentLeft((userId: string) => {
      console.log('[DEBUG OpponentLeft] Event reçu, userId:', userId)
      setRematchStatus('opponent-left')
      setPendingGameId(null)
      console.log('[DEBUG OpponentLeft] rematchStatus:', 'opponent-left')
    })
    // Écouter les demandes de rematch (nouvel événement dédié)
    mmService.onRematchRequest((data: any) => {
      console.log('🔄 Demande de rematch reçue:', data)
      
      // Vérifier si c'est une demande de l'adversaire actuel
      if (data.requesterId === opponentId) {
        if (rematchStatus === 'waiting' && pendingGameId) {
          // Les deux veulent rejouer ! Accepter automatiquement
          console.log('✅ Les deux joueurs veulent rejouer ! Acceptation automatique')
          matchmakingService.acceptRematch(data.gameId).then(() => {
            navigate(`/game/${data.gameId}`)
          })
        } else {
          // L'adversaire veut rejouer, on stocke la demande
          console.log('📥 L\'adversaire veut rejouer, demande stockée')
          setPendingGameId(data.gameId)
          setRematchStatus('opponent-waiting')
        }
      }
    })
    
    // Écouter si l'adversaire refuse le rematch
    mmService.onRematchDeclined((data: any) => {
      console.log('❌ Rematch refusé:', data)
      // Mettre à jour l'état pour montrer que l'adversaire a quitté
      setRematchStatus((current) => {
        console.log('État actuel:', current)
        if (current === 'waiting' || current === 'opponent-waiting') {
          return 'opponent-left'
        }
        return current
      })
      setPendingGameId(null)
    })
    
    // Écouter si l'adversaire accepte le rematch
    mmService.onRematchAccepted((data: any) => {
      console.log('✅ Rematch accepté:', data)
      setRematchStatus((current) => {
        if (current === 'waiting') {
          // L'adversaire a accepté, naviguer vers la partie
          console.log('🎮 Navigation vers la partie acceptée:', data.gameId)
          navigate(`/game/${data.gameId}`)
        }
        return current
      })
    })
  }, [config.gameMode, game.status, game.playerXId, game.playerOId, navigate])
  
  const handleRematch = async () => {
    if (config.gameMode !== "VsPlayerOnline") return
    
    try {
      const userId = authService.getUserIdFromToken()
      const opponentId = userId === game.playerXId ? game.playerOId : game.playerXId
      
      console.log('🔄 Demande de rematch avec:', opponentId)
      
      // Vérifier si l'adversaire a déjà envoyé une demande de rematch
      if (pendingGameId) {
        // Les deux veulent rejouer ! Accepter la demande de l'adversaire
        console.log('✅ Les deux joueurs veulent rejouer ! Acceptation de la demande')
        await mmService.acceptRematch(pendingGameId)
        navigate(`/game/${pendingGameId}`)
        return
      }
      
      // Envoyer notre demande de rematch
      const result = await mmService.requestRematch(opponentId)
      console.log('✅ Demande de rematch envoyée, gameId:', result.gameId)
      
      // Passer en mode attente
      setRematchStatus('waiting')
      setPendingGameId(result.gameId)
    } catch (error) {
      console.error('❌ Erreur lors de la réinvitation:', error)
      setRematchStatus('opponent-left')
    }
  }
  
  const handleLeaveLobby = () => {
    // Notifier l'adversaire si un rematch est en cours
    if (pendingGameId) {
      // Si on avait envoyé une demande OU si l'adversaire en avait envoyé une
      if (rematchStatus === 'waiting' || rematchStatus === 'opponent-waiting') {
        mmService.declineRematch(pendingGameId).catch(console.error)
      }
    }
    // Log avant LeaveGame
    console.log('[DEBUG] Appel LeaveGame sur le hub pour gameId:', game.id)
    navigate('/lobby')
  }
  
  try {
    // DEBUG : log du statut et de la ligne gagnante
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[GamePlaying] status:", game.status, "winningLine:", game.winningLine)
      console.log('[DEBUG] GamePlaying render, gameId:', game.id, 'mode:', config.gameMode, 'conn:', mmService.getConnection())
    }
    const getPlayerName = (symbol: Symbol): string => {
      if (config.gameMode === "VsComputer") {
        return symbol === config.chosenSymbol ? config.player1Name : "EasiBot"
      }
      return symbol === config.chosenSymbol ? config.player1Name : config.player2Name
    }

  const isLoading = appState === "loading"
  const isFinished = game.status !== "InProgress"
  const isMyTurn = game.currentTurn === config.chosenSymbol
  const isAiThinking = config.gameMode === "VsComputer" && !isMyTurn && !isFinished
  const canClick = config.gameMode === "VsPlayerLocal" ? true : isMyTurn

  const winnerSymbol: Symbol | "draw" | null = 
    game.status === "XWins" ? "X" : 
    game.status === "OWins" ? "O" :
    game.status === "Draw" ? "draw" :
    null
  const isDraw = game.status === "Draw"

  const getPlayer1Label = () => config.gameMode === "VsComputer" ? "Vous" : config.player1Name
  const getPlayer2Label = () => config.gameMode === "VsComputer" ? "EasiBot" : config.player2Name

  // Pour StatusDisplay et ScoreBadge, les noms doivent correspondre aux symboles X et O
  // En mode online: player1Name = playerXName, player2Name = playerOName (pas d'inversion)
  // En mode local: X = player1, O = player2
  // En mode IA: X ou O = player selon chosenSymbol
  const playerXName = config.gameMode === "VsPlayerOnline"
    ? config.player1Name  // player1Name est déjà playerXName
    : config.gameMode === "VsPlayerLocal" 
      ? config.player1Name 
      : (config.chosenSymbol === "X" ? config.player1Name : config.player2Name)
      
  const playerOName = config.gameMode === "VsPlayerOnline"
    ? config.player2Name  // player2Name est déjà playerOName
    : config.gameMode === "VsPlayerLocal" 
      ? config.player2Name 
      : (config.chosenSymbol === "X" ? config.player2Name : config.player1Name)

  // Labels pour les ScoreBadges
  const scorePlayer1Label = config.gameMode === "VsComputer" ? "Vous" : playerXName
  const scorePlayer2Label = config.gameMode === "VsComputer" ? "EasiBot" : playerOName

  // Scores corrects selon qui a quel symbole
  const player1Score = config.gameMode === "VsComputer" 
    ? (config.chosenSymbol === "X" ? scores.X : scores.O)
    : scores.X
  const player2Score = config.gameMode === "VsComputer"
    ? (config.chosenSymbol === "X" ? scores.O : scores.X)
    : scores.O

  // Vérifier si la partie est en attente (board vide) - DÉSACTIVÉ car les deux joueurs doivent voir le plateau
  // Le board commence vide et c'est normal, le premier joueur peut commencer à jouer
  const isWaitingForOpponent = false
  // Ancienne logique : config.gameMode === "VsPlayerOnline" && game.board.every(cell => cell === null) && game.status === "InProgress"

  return (
    <div className={styles.container}>
      {/* Bouton pour abandonner la partie en cours */}
      {game.status === "InProgress" && (
        <div className={styles.leave_container}>
          <button
            className={styles.leave_button}
            onClick={() => setShowConfirm(true)}
            disabled={isForfeiting}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <LogOut color="#e53935" size={20} />
            {isForfeiting ? "Abandon en cours..." : "Abandonner la partie"}
          </button>
          {showConfirm && (
            <div className={styles.confirm_dialog}>
              <div className={styles.confirm_message}>
                <LogOut color="#e53935" size={32} />
                <span>Voulez-vous vraiment abandonner la partie ?</span>
              </div>
              <div className={styles.confirm_actions}>
                <button className={styles.confirm_yes} onClick={handleForfeit} disabled={isForfeiting} style={{ color: "#fff", background: "#e53935" }}>Oui, abandonner</button>
                <button className={styles.confirm_no} onClick={() => setShowConfirm(false)} disabled={isForfeiting}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Affichage du mode de jeu courant */}
      <div className={styles.mode_label}>
        {(() => {
          switch (modeLabel) {
            case "VsComputer": return "Mode : contre EasiBot"
            case "VsPlayerLocal": return "Mode : en local"
            case "VsPlayerOnline": return "Mode : contre un ami"
            default: return "Mode : inconnu"
          }
        })()}
      </div>
      {/* État d'attente pour parties multijoueur */}
      {isWaitingForOpponent && (
        <motion.div
          className={styles.waiting}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.loading__spinner} />
          <p className={styles.loading__text}>
            En attente que {playerOName} accepte l'invitation...
          </p>
          <p className={styles.loading__subtext}>
            Vous pouvez attendre ici ou revenir au lobby
          </p>
        </motion.div>
      )}

      {/* Scores avec ScoreBadges */}
      {!isWaitingForOpponent && (
        <motion.div
          className={styles.scores}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 } as const}
        >
          <ScoreBadge 
            label={`${playerXName} (X)`}
            value={scores.X} 
            variant="x" 
          />
          <ScoreBadge label="Nuls" value={scores.draws} variant="draw" />
          <ScoreBadge 
            label={`${playerOName} (O)`}
            value={scores.O} 
            variant="o" 
          />
        </motion.div>
      )}

      {/* Message d'erreur */}
      {error && !isWaitingForOpponent && (
        <motion.div 
          className={styles.error}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>{error}</p>
        </motion.div>
      )}

      {/* Status du jeu (À votre tour, etc.) */}
      {!isWaitingForOpponent && (
        <StatusDisplay
          currentPlayer={game.currentTurn}
          winner={winnerSymbol}
          isDraw={isDraw}
          isAiTurn={isAiThinking}
          player1Name={playerXName}
          player2Name={playerOName}
          gameMode={mapApiMode(config.gameMode)}
          playerSymbol={config.chosenSymbol}
        />
      )}

      {/* Plateau de jeu */}
      {!isWaitingForOpponent && (
        <GameBoard
          board={game.board}
          onCellClick={onCellClick}
          disabled={isLoading || isFinished || !canClick}
          winningLine={game.winningLine || []}
          rows={game.height}
          cols={game.width}
        />
      )}

      {/* Contrôles de fin de partie pour les parties en ligne */}
      {isFinished && config.gameMode === "VsPlayerOnline" && !isLoading && (
        <motion.div
          className={styles.onlineControls}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Message de statut */}
          {rematchStatus === 'waiting' && (
            <motion.div
              className={styles.statusMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock size={16} />
              En attente de l'adversaire...
            </motion.div>
          )}
          
          {rematchStatus === 'opponent-waiting' && (
            <motion.div
              className={styles.statusMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock size={16} />
              Votre adversaire veut rejouer !
            </motion.div>
          )}
          
          {rematchStatus === 'opponent-left' && (
            <motion.div
              className={styles.statusMessageError}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              L'adversaire a quitté la partie
            </motion.div>
          )}
          
          <div className={styles.buttonGroup}>
            <GameButton 
              onClick={handleLeaveLobby} 
              variant="secondary"
              className={styles.controlButton}
              disabled={rematchStatus === 'waiting'}
            >
              <Home size={20} />
              Retour au lobby
            </GameButton>
            {rematchStatus !== 'opponent-left' && (
              <GameButton 
                onClick={handleRematch}
                variant="primary"
                className={styles.controlButton}
                disabled={rematchStatus === 'waiting'}
              >
                <RotateCcw size={20} />
                {rematchStatus === 'waiting' ? 'En attente...' : 'Rejouer'}
              </GameButton>
            )}
          </div>
        </motion.div>
      )}

      {/* Message de chargement nouvelle partie */}
      {isLoading && (
        <motion.div
          className={styles.loading}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.loading__spinner} />
          <p className={styles.loading__text}>
            {isFinished ? "Nouvelle partie..." : "En attente..."}
          </p>
        </motion.div>
      )}
    </div>
  )
  } catch (err) {
    console.error("❌ ERREUR dans GamePlaying:", err)
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <h2>Erreur dans GamePlaying</h2>
        <pre>{String(err)}</pre>
      </div>
    )
  }
}
