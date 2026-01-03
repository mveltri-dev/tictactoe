import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import type { GameDTO, GameModeAPI, Symbol, AppState } from "../../../dtos"
import { GameBoard } from "../GameBoard/GameBoard"
import { StatusDisplay } from "../../molecules"
import { ScoreBadge, GameButton } from "../../atoms"
import { GameControls } from "../../molecules"
import { Home, RotateCcw } from "lucide-react"
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

export function GamePlaying({
  game,
  config,
  appState,
  error,
  scores,
  onCellClick,
  onNewGame,
  onRestart
}: GamePlayingProps) {
  const navigate = useNavigate()
  
  try {
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
          <GameButton 
            onClick={() => navigate('/lobby')} 
            variant="secondary"
            className={styles.controlButton}
          >
            <Home size={20} />
            Retour au lobby
          </GameButton>
          <GameButton 
            onClick={() => {
              // Retourner au lobby pour relancer une invitation
              navigate('/lobby')
            }} 
            variant="primary"
            className={styles.controlButton}
          >
            <RotateCcw size={20} />
            Rejouer
          </GameButton>
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
