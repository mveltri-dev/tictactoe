import { motion } from "framer-motion"
import type { GameDTO, GameModeAPI, Symbol, AppState } from "../../../dtos"
import { GameBoard } from "../GameBoard/GameBoard"
import { StatusDisplay } from "../../molecules"
import { ScoreBadge } from "../../atoms"
import { GameControls } from "../../molecules"
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
  // En mode 1v1 local, X = player1, O = player2 (toujours)
  // En mode IA, X ou O = player selon chosenSymbol
  const playerXName = config.gameMode === "VsPlayerLocal" 
    ? config.player1Name 
    : (config.chosenSymbol === "X" ? config.player1Name : config.player2Name)
  const playerOName = config.gameMode === "VsPlayerLocal" 
    ? config.player2Name 
    : (config.chosenSymbol === "X" ? config.player2Name : config.player1Name)

  // Labels pour les ScoreBadges
  const scorePlayer1Label = config.gameMode === "VsComputer" ? "Vous" : playerXName
  const scorePlayer2Label = config.gameMode === "VsComputer" ? "EasiBot" : playerOName

  return (
    <div className={styles.container}>
      {/* Scores avec ScoreBadges */}
      <motion.div
        className={styles.scores}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 } as const}
      >
        <ScoreBadge 
          label={scorePlayer1Label} 
          value={scores.X} 
          variant="x" 
        />
        <ScoreBadge label="Nuls" value={scores.draws} variant="draw" />
        <ScoreBadge 
          label={scorePlayer2Label} 
          value={scores.O} 
          variant="o" 
        />
      </motion.div>

      {/* Message d'erreur */}
      {error && (
        <motion.div 
          className={styles.error}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>{error}</p>
        </motion.div>
      )}

      {/* Status du jeu (À votre tour, etc.) */}
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

      {/* Plateau de jeu */}
      <GameBoard
        board={game.board}
        onCellClick={onCellClick}
        disabled={isLoading || isFinished || !canClick}
        winningLine={game.winningLine || []}
      />

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
}
