import { useState, useEffect } from 'react'
import { roomService } from '../../services/roomService'
import { signalrService } from '../../services/signalrService'
import type { RoomDTO } from '../../dtos'
import styles from './RoomLobby.module.css'

interface RoomLobbyProps {
  token: string
  onLogout: () => void
  onGameStart: (gameId: string) => void
}

export function RoomLobby({ token, onLogout, onGameStart }: RoomLobbyProps) {
  const [currentRoom, setCurrentRoom] = useState<RoomDTO | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'waiting'>('menu')

  useEffect(() => {
    // Connecter SignalR
    signalrService.connect().catch(console.error)

    // Configurer les callbacks
    signalrService.setCallbacks({
      onPlayerJoinedRoom: (room) => {
        console.log('Player joined room:', room)
        setCurrentRoom(room)
      },
      onGameStarted: (room) => {
        console.log('Game started:', room)
        if (room.gameId) {
          onGameStart(room.gameId)
        }
      },
      onRoomClosed: () => {
        setError('La room a été fermée par l\'hôte')
        setView('menu')
        setCurrentRoom(null)
      },
    })

    return () => {
      if (currentRoom) {
        signalrService.leaveRoomGroup(currentRoom.code).catch(console.error)
      }
      signalrService.disconnect()
    }
  }, [])

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('Veuillez entrer un nom de room')
      return
    }

    setLoading(true)
    setError('')

    try {
      const room = await roomService.createRoom(roomName)
      setCurrentRoom(room)
      await signalrService.joinRoomGroup(room.code)
      setView('waiting')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Veuillez entrer un code de room')
      return
    }

    setLoading(true)
    setError('')

    try {
      const room = await roomService.joinRoom(roomCode.toUpperCase())
      setCurrentRoom(room)
      await signalrService.joinRoomGroup(room.code)
      setView('waiting')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion à la room')
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = async () => {
    if (!currentRoom) return

    setLoading(true)
    setError('')

    try {
      const room = await roomService.startGame(currentRoom.id)
      if (room.gameId) {
        await signalrService.joinGameGroup(room.gameId)
        onGameStart(room.gameId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du démarrage de la partie')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'waiting' && currentRoom) {
    const isHost = currentRoom.guestUsername === null || currentRoom.status === 'Waiting'
    const canStart = currentRoom.status === 'Ready'

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>{currentRoom.name}</h2>
          <div className={styles.code}>Code: {currentRoom.code}</div>
          
          <div className={styles.players}>
            <div className={styles.player}>
              <span className={styles.playerIcon}>👑</span>
              <span>{currentRoom.hostUsername} (Hôte)</span>
            </div>
            {currentRoom.guestUsername ? (
              <div className={styles.player}>
                <span className={styles.playerIcon}>🎮</span>
                <span>{currentRoom.guestUsername}</span>
              </div>
            ) : (
              <div className={styles.playerWaiting}>
                En attente d'un joueur...
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {isHost && canStart && (
            <button
              className={styles.startButton}
              onClick={handleStartGame}
              disabled={loading}
            >
              {loading ? 'Démarrage...' : 'Démarrer la partie'}
            </button>
          )}

          {!isHost && (
            <div className={styles.waiting}>
              En attente du démarrage par l'hôte...
            </div>
          )}

          <button
            className={styles.backButton}
            onClick={() => {
              if (currentRoom) {
                signalrService.leaveRoomGroup(currentRoom.code)
              }
              setCurrentRoom(null)
              setView('menu')
            }}
          >
            Quitter la room
          </button>
        </div>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Créer une Room</h2>
          
          <div className={styles.field}>
            <label htmlFor="roomName">Nom de la room</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ma super partie"
              maxLength={50}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.submitButton}
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer'}
          </button>

          <button className={styles.backButton} onClick={() => setView('menu')}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (view === 'join') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Rejoindre une Room</h2>
          
          <div className={styles.field}>
            <label htmlFor="roomCode">Code de la room</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.submitButton}
            onClick={handleJoinRoom}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>

          <button className={styles.backButton} onClick={() => setView('menu')}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Multijoueur en ligne</h2>
          <button className={styles.logoutButton} onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
        
        <div className={styles.menu}>
          <button
            className={styles.menuButton}
            onClick={() => setView('create')}
          >
            Créer une room
          </button>

          <button
            className={styles.menuButton}
            onClick={() => setView('join')}
          >
            Rejoindre une room
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  )
}
