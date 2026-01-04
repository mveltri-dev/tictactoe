import { IconX, IconO } from "../../atoms"
import type { Symbol, GameStatus as Status } from "../../../dtos"
import styles from "./GameStatus.module.css"

interface GameStatusProps {
  status: Status
  currentTurn: Symbol
  winnerId?: string | null
}

export function GameStatus({ status, currentTurn, winnerId }: GameStatusProps) {
  const renderMessage = () => {
    if (status === "XWins") {
      return <div className={styles.status__title}>🎉 X a gagné !</div>
    }
    
    if (status === "OWins") {
      return <div className={styles.status__title}>🎉 O a gagné !</div>
    }
    
    if (status === "Draw") {
      return <div className={styles.status__title}>Match nul !</div>
    }
    
    // En cours
    return (
      <>
        <div className={styles.status__title}>Tour de :</div>
        <div className={styles.status__turn}>
          {currentTurn === "X" ? (
            <IconX className={styles['status__turn-icon']} />
          ) : (
            <IconO className={styles['status__turn-icon']} />
          )}
          <span>{currentTurn}</span>
        </div>
      </>
    )
  }

  return <div className={styles.status}>{renderMessage()}</div>
}

