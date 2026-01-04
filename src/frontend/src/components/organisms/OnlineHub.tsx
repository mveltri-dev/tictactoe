import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Trophy, Users, Gamepad2, Settings, LogOut, UserPlus, X, Search, Loader2 } from "lucide-react"
import { userService } from "../../services/userService"
import { friendsService, type Friend, type FriendRequest } from "../../services/friendsService"
import { matchmakingService, type MatchFoundData } from "../../services/matchmakingService"
import styles from "./OnlineHub.module.css"
import { Leaderboard } from "../Leaderboard"
import { useToast } from "../organisms/toast/toast"

type OnlineView = "hub" | "profile" | "leaderboard" | "friends" | "play"

interface OnlineHubProps {
  onLogout: () => void
  onStartMatchmaking: () => void
  onGameFound: (gameId: string, opponentUsername: string, yourSymbol: "X" | "O") => void
}

interface UserProfile {
  id: string
  username: string
  email: string
}

interface UserStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  score: number
  rank: number
}

interface GameInvitation {
  gameId: string
  inviterId: string
  inviterUsername: string
  invitedAt: Date
}

interface SentInvitation {
  gameId: string
  inviteeId: string
  inviteeUsername: string
  invitedAt: Date
}

export function OnlineHub({ onLogout, onStartMatchmaking, onGameFound }: OnlineHubProps) {
  const { showSuccess, showError } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<OnlineView>("hub")
  const [viewHistory, setViewHistory] = useState<OnlineView[]>(["hub"])
  const [gameInvitations, setGameInvitations] = useState<GameInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([])
  const [activeGames, setActiveGames] = useState<Array<{ gameId: string, opponentName: string }>>([])

  const navigateToView = (view: OnlineView) => {
    setViewHistory(prev => [...prev, view])
    setCurrentView(view)
  }

  const navigateBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory]
      newHistory.pop() // Retirer la vue actuelle
      const previousView = newHistory[newHistory.length - 1]
      setViewHistory(newHistory)
      setCurrentView(previousView)
    } else {
      setCurrentView("hub")
    }
  }

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true)
        const [profileData, statsData] = await Promise.all([
          userService.getProfile(),
          userService.getStats()
        ])
        setProfile(profileData)
        setStats(statsData)
        
        // Configurer les callbacks SignalR AVANT d'initialiser la connexion
        matchmakingService.onMatchFound((data: MatchFoundData) => {
          onGameFound(data.gameId, data.opponentUsername, data.yourSymbol)
        })
        
        matchmakingService.onGameInvitation((data: any) => {
          const invitation: GameInvitation = {
            gameId: data.gameId,
            inviterId: data.inviterId,
            inviterUsername: data.inviterUsername,
            invitedAt: new Date()
          }
          setGameInvitations(prev => {
            const exists = prev.some(inv => inv.gameId === invitation.gameId)
            if (exists) return prev
            return [invitation, ...prev]
          })
        })
        
        matchmakingService.onInvitationDeclined((data: any) => {
          setSentInvitations(prev => prev.filter(inv => inv.gameId !== data.gameId))
        })

        matchmakingService.onInvitationAccepted((data: any) => {
          setSentInvitations(prev => prev.filter(inv => inv.gameId !== data.gameId))
          setActiveGames(prev => {
            const exists = prev.some(game => game.gameId === data.gameId)
            if (exists) return prev
            return [...prev, { gameId: data.gameId, opponentName: data.accepterUsername }]
          })
        })
        
        // Initialiser SignalR APRÈS avoir configuré les callbacks
        await matchmakingService.initializeConnection()
        
        // Charger les invitations en attente
        try {
          const [pendingInvitations, sentInvitationsData, activeGamesData] = await Promise.all([
            matchmakingService.getPendingInvitations(),
            matchmakingService.getSentInvitations(),
            matchmakingService.getActiveGames()
          ])
          const formattedInvitations: GameInvitation[] = pendingInvitations.map(inv => ({
            gameId: inv.gameId,
            inviterId: inv.inviterId,
            inviterUsername: inv.inviterUsername,
            invitedAt: new Date(inv.invitedAt)
          }))
          const formattedSentInvitations: SentInvitation[] = sentInvitationsData.map(inv => ({
            gameId: inv.gameId,
            inviteeId: inv.inviteeId,
            inviteeUsername: inv.inviteeUsername,
            invitedAt: new Date(inv.invitedAt)
          }))
          const formattedActiveGames = activeGamesData.map(game => ({
            gameId: game.gameId,
            opponentName: game.opponentName
          }))
          setGameInvitations(formattedInvitations)
          setSentInvitations(formattedSentInvitations)
          setActiveGames(formattedActiveGames)
        } catch (err) {
          console.error('Erreur chargement invitations:', err)
        }
      } catch (err) {
        console.error('Erreur chargement données utilisateur:', err)
        window.location.href = "/login"
        return
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
    
    return () => {
      // Cleanup: déconnecter SignalR
      matchmakingService.disconnect()
    }
  }, [onGameFound])

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading_spinner} />
        <p>Chargement...</p>
      </div>
    )
  }

  if (error || !profile || !stats) {
    return (
      <div className={styles.error}>
        <p>Erreur : {error}</p>
        <button onClick={onLogout}>Retour</button>
      </div>
    )
  }

  const quickActions = [
    {
      id: "matchmaking",
      label: "Trouver une partie",
      icon: Gamepad2,
      color: styles.action_green,
      onClick: () => navigateToView("play")
    },
    {
      id: "friends",
      label: "Gérer mes amis",
      icon: Users,
      color: styles.action_blue,
      onClick: () => navigateToView("friends")
    },
    {
      id: "leaderboard",
      label: "Voir le classement",
      icon: Trophy,
      color: styles.action_yellow,
      onClick: () => navigateToView("leaderboard")
    },
    {
      id: "profile",
      label: "Modifier mon profil",
      icon: Settings,
      color: styles.action_purple,
      onClick: () => navigateToView("profile")
    }
  ]

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className={styles.card}>
        {/* Header avec info utilisateur */}
        <div className={styles.header}>
          <div className={styles.user_info}>
            <div className={styles.avatar}>
              <Gamepad2 className={styles.avatar_icon} />
            </div>
            <div>
              <h2 className={styles.username}>{profile.username}</h2>
              <div className={styles.stats_inline}>
                <span className={styles.stat_item}>
                  Score: <span className={styles.stat_value}>{stats.score}</span>
                </span>
                <span className={styles.stat_item}>
                  Rang: <span className={styles.stat_value}>#{stats.rank}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={styles.logout_button}
            title="Déconnexion"
          >
            <LogOut className={styles.logout_icon} />
          </button>
        </div>

        {/* Contenu principal */}
        <div className={styles.content}>
          {currentView !== "hub" && (
            <button
              onClick={navigateBack}
              className={styles.back_button}
            >
              ← 
            </button>
          )}
          <AnimatePresence mode="wait">
            {currentView === "hub" && (
              <HubHome key="hub" profile={profile} stats={stats} quickActions={quickActions} />
            )}
            {currentView === "play" && (
              <PlayView
                key="play"
                onStartMatchmaking={onStartMatchmaking}
                gameInvitations={gameInvitations}
                setGameInvitations={setGameInvitations}
                sentInvitations={sentInvitations}
                setSentInvitations={setSentInvitations}
                activeGames={activeGames}
                setActiveGames={setActiveGames}
              />
            )}
            {currentView === "friends" && (
              <FriendsView key="friends" />
            )}
            {currentView === "leaderboard" && (
              <Leaderboard key="leaderboard" currentUserId={profile.id} />
            )}
            {currentView === "profile" && (
              <ProfileView key="profile" profile={profile} stats={stats} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// Composant Home
function HubHome({ profile, stats, quickActions }: { 
  profile: UserProfile; 
  stats: UserStats; 
  quickActions: any[] 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className={styles.welcome}>
        <h3 className={styles.welcome_title}>Bienvenue, {profile.username} !</h3>
        <p className={styles.welcome_subtitle}>Que voulez-vous faire aujourd'hui ?</p>
      </div>

      {/* Stats rapides */}
      <div className={styles.stats_grid}>
        <div className={styles.stat_card}>
          <p className={styles.stat_number_primary}>{stats.score}</p>
          <p className={styles.stat_label}>Score</p>
        </div>
        <div className={styles.stat_card}>
          <p className={styles.stat_number_primary}>{stats.wins}</p>
          <p className={styles.stat_label}>Victoires</p>
        </div>
        <div className={styles.stat_card}>
          <p className={styles.stat_number}>{stats.gamesPlayed}</p>
          <p className={styles.stat_label}>Parties</p>
        </div>
        <div className={styles.stat_card}>
          <p className={styles.stat_number_green}>{stats.winRate.toFixed(1)}%</p>
          <p className={styles.stat_label}>Taux victoire</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className={styles.actions_grid}>
        {quickActions.map((action) => (
          <motion.button
            key={action.id}
            onClick={action.onClick}
            className={`${styles.action_button} ${action.color}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.action_icon_wrapper}>
              <action.icon className={styles.action_icon} />
            </div>
            <span className={styles.action_label}>{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

interface SentInvitation {
  gameId: string
  inviteeId: string
  inviteeUsername: string
  invitedAt: Date
}

// Composant Jouer
function PlayView({ 
  onStartMatchmaking, 
  gameInvitations, 
  setGameInvitations,
  sentInvitations,
  setSentInvitations,
  activeGames,
  setActiveGames
}: { 
  onStartMatchmaking: () => void
  gameInvitations: GameInvitation[]
  setGameInvitations: React.Dispatch<React.SetStateAction<GameInvitation[]>>
  sentInvitations: SentInvitation[]
  setSentInvitations: React.Dispatch<React.SetStateAction<SentInvitation[]>>
  activeGames: Array<{ gameId: string, opponentName: string }>
  setActiveGames: React.Dispatch<React.SetStateAction<Array<{ gameId: string, opponentName: string }>>>
}) {
  const [isSearching, setIsSearching] = useState(false)
  const [showFriendsList, setShowFriendsList] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [error, setError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (showFriendsList) {
      loadFriends()
    }
  }, [showFriendsList])

  const loadFriends = async () => {
    try {
      const data = await friendsService.getFriends()
      // Charger tous les amis (online et offline)
      setFriends(data)
    } catch (err) {
      console.error('Erreur chargement amis:', err)
    }
  }

  const handleStartMatchmaking = async () => {
    try {
      setIsSearching(true)
      setError(null)
      await matchmakingService.joinMatchmaking()
    } catch (err) {
      setError(getUserFriendlyError(err))
      setIsSearching(false)
    }
  }

  const handleCancelMatchmaking = async () => {
    try {
      await matchmakingService.leaveMatchmaking()
      setIsSearching(false)
    } catch (err) {
      console.error('Erreur annulation:', err)
    }
  }

  const handleInviteFriend = async (friendId: string) => {
    try {
      const result = await matchmakingService.inviteFriend(friendId)
      // Recharger la liste des invitations envoyées
      const sentInvitationsData = await matchmakingService.getSentInvitations()
      const formattedSentInvitations: SentInvitation[] = sentInvitationsData.map(inv => ({
        gameId: inv.gameId,
        inviteeId: inv.inviteeId,
        inviteeUsername: inv.inviteeUsername,
        invitedAt: new Date(inv.invitedAt)
      }))
      setSentInvitations(formattedSentInvitations)
      showSuccess(`Invitation envoyée à ${friends.find(f => f.id === friendId)?.username} !`)
      // Rediriger vers la vue "play" après l'envoi
      setTimeout(() => {
        setShowFriendsList(false)
      }, 1500)
    } catch (err) {
      showError(getUserFriendlyError(err))
    }
  }

  const handleAcceptInvitation = async (gameId: string, inviterUsername: string) => {
    try {
      // Appeler l'API backend pour notifier l'inviteur
      await matchmakingService.acceptInvitation(gameId)
      // Retirer l'invitation de la liste
      setGameInvitations(prev => prev.filter(inv => inv.gameId !== gameId))
      // Ajouter aux parties actives (sans doublon)
      setActiveGames(prev => {
        const exists = prev.some(game => game.gameId === gameId)
        if (exists) return prev
        return [...prev, { gameId, opponentName: inviterUsername }]
      })
      // Rediriger vers la partie
      window.location.href = `/game/${gameId}`
    } catch (err) {
      showError(getUserFriendlyError(err))
    }
  }

  const handleDeclineInvitation = async (gameId: string) => {
    try {
      await matchmakingService.declineInvitation(gameId)
      setGameInvitations(prev => prev.filter(inv => inv.gameId !== gameId))
      showSuccess('Invitation refusée')
    } catch (err) {
      showError(getUserFriendlyError(err))
    }
  }

  if (isSearching) {
    return (
      <div className={styles.searching_container}>
        <Loader2 className={styles.searching_spinner} size={64} />
        <h3 className={styles.searching_title}>Recherche d'un adversaire...</h3>
        <p className={styles.searching_subtitle}>Cela ne devrait prendre que quelques instants</p>
        <button
          onClick={handleCancelMatchmaking}
          className={styles.form_button}
        >
          Annuler la recherche
        </button>
      </div>
    )
  }

  if (showFriendsList) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={styles.view_container}
      >
        <h3 className={styles.view_title}>Inviter un ami</h3>
        <p className={styles.view_subtitle}>Sélectionnez un ami pour l'inviter à jouer</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.friends_list}>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend.id} className={styles.friend_item}>
                <div className={styles.friend_avatar_with_status}>
                  <div className={styles.friend_avatar}>
                    {friend.avatar}
                  </div>
                  <span
                    className={styles.status_dot_small}
                    style={{ backgroundColor: friend.status === "online" ? "#10b981" : "#6b7280" }}
                  />
                </div>
                <div className={styles.friend_info}>
                  <p className={styles.friend_username}>{friend.username}</p>
                  <p className={styles.friend_meta}>
                    {friend.status === "online" ? "En ligne" : "Hors ligne"} • Score: {friend.score}
                  </p>
                </div>
                <button
                  className={`${styles.form_button} ${styles.form_button_primary}`}
                  onClick={() => handleInviteFriend(friend.id)}
                >
                  Inviter
                </button>
              </div>
            ))
          ) : (
            <p className={styles.empty_message}>Vous n'avez pas encore d'amis. Ajoutez des amis dans "Gérer mes amis" pour pouvoir les inviter.</p>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={styles.view_container}
    >
      <h3 className={styles.view_title}>Trouver une partie</h3>
      <p className={styles.view_subtitle}>Choisissez votre mode de jeu</p>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {/* Parties actives */}
      {activeGames.length > 0 && (
        <div className={styles.invitations_section}>
          <h4 className={styles.section_subtitle}>🎮 Parties en cours</h4>
          {activeGames.map(game => (
            <div key={game.gameId} className={styles.invitation_item}>
              <div className={styles.invitation_info}>
                <p className={styles.invitation_username}>{game.opponentName}</p>
                <p className={styles.invitation_meta}>partie en cours</p>
              </div>
              <div className={styles.invitation_actions}>
                <button
                  className={`${styles.form_button} ${styles.form_button_primary}`}
                  onClick={() => window.location.href = `/game/${game.gameId}`}
                >
                  🕹️ Rejoindre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section des invitations reçues */}
      {gameInvitations.filter(inv => !activeGames.some(game => game.gameId === inv.gameId)).length > 0 && (
        <div className={styles.invitations_section}>
          <h4 className={styles.section_subtitle}>🎮 Invitations reçues</h4>
          {gameInvitations.filter(inv => !activeGames.some(game => game.gameId === inv.gameId)).map((invitation) => (
            <div key={invitation.gameId} className={styles.invitation_item}>
              <div className={styles.invitation_info}>
                <p className={styles.invitation_username}>{invitation.inviterUsername}</p>
                <p className={styles.invitation_meta}>vous invite à jouer</p>
              </div>
              <div className={styles.invitation_actions}>
                <button
                  className={`${styles.form_button} ${styles.form_button_success}`}
                  onClick={() => handleAcceptInvitation(invitation.gameId, invitation.inviterUsername)}
                >
                  ✓ Accepter
                </button>
                <button
                  className={`${styles.form_button} ${styles.form_button_secondary}`}
                  onClick={() => handleDeclineInvitation(invitation.gameId)}
                >
                  ✕ Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section des invitations envoyées */}
      {sentInvitations.filter(inv => !activeGames.some(game => game.gameId === inv.gameId)).length > 0 && (
        <div className={styles.invitations_section}>
          <h4 className={styles.section_subtitle}>📤 Invitations envoyées (en attente)</h4>
          {sentInvitations.filter(inv => !activeGames.some(game => game.gameId === inv.gameId)).map((invitation) => (
            <div key={invitation.gameId} className={styles.invitation_item}>
              <div className={styles.invitation_info}>
                <p className={styles.invitation_username}>{invitation.inviteeUsername}</p>
                <p className={styles.invitation_meta}>en attente de réponse...</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className={styles.play_options}>
        <motion.button
          onClick={handleStartMatchmaking}
          className={`${styles.action_button} ${styles.action_green}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.action_icon_wrapper}>
            <Gamepad2 className={styles.action_icon} />
          </div>
          <div>
            <span className={styles.action_label}>Jouer en ligne</span>
            <p className={styles.action_description}>Trouver un adversaire aléatoire</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowFriendsList(true)}
          className={`${styles.action_button} ${styles.action_blue}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.action_icon_wrapper}>
            <Users className={styles.action_icon} />
          </div>
          <div>
            <span className={styles.action_label}>Jouer contre un ami</span>
            <p className={styles.action_description}>Inviter un ami à jouer</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

// Composant Amis
function FriendsView() {
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showRequestsSection, setShowRequestsSection] = useState(true)
  const [showFriendsSection, setShowFriendsSection] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  // Charger la liste des amis et des demandes au montage
  useEffect(() => {
    loadFriends()
    loadFriendRequests()
  }, [])

  // Rechercher des utilisateurs quand la recherche est active
  useEffect(() => {
    if (showAddFriend && searchQuery.trim()) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, showAddFriend])

  const loadFriends = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await friendsService.getFriends()
      setFriends(data)
    } catch (err) {
      setError('⚠️ Impossible de charger vos amis. Vérifiez votre connexion et réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFriendRequests = async () => {
    try {
      const data = await friendsService.getFriendRequests()
      setFriendRequests(data)
    } catch (err) {
      console.error('Erreur chargement demandes:', err)
    }
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId)
      setSearchQuery('')
      setShowAddFriend(false)
      showSuccess('Demande d\'ami envoyée avec succès !')
    } catch (err) {
      showError('Impossible d\'envoyer la demande. Réessayez dans quelques instants.')
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendsService.acceptFriendRequest(requestId)
      await loadFriends()
      await loadFriendRequests()
      showSuccess('Demande acceptée ! Vous êtes maintenant amis.')
    } catch (err) {
      showError('Impossible d\'accepter la demande. Réessayez.')
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    try {
      await friendsService.rejectFriendRequest(requestId)
      await loadFriendRequests()
      showSuccess('Demande refusée.')
    } catch (err) {
      showError('Impossible de refuser la demande. Réessayez.')
    }
  }

  const searchUsers = async () => {
    try {
      setIsSearching(true)
      const data = await friendsService.searchUsers(searchQuery)
      // Filtrer les utilisateurs déjà amis
      const nonFriends = data.filter(user => !friends.some(f => f.id === user.id))
      setSearchResults(nonFriends)
    } catch (err) {
      console.error('Erreur recherche:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const loadFriendDetails = async (friendId: string) => {
    try {
      const data = await friendsService.getFriendStats(friendId)
      setSelectedFriend(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des détails')
    }
  }
  
  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "#10b981"
      case "in-game": return "#f59e0b"
      default: return "#6b7280"
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "En ligne"
      case "in-game": return "En partie"
      default: return "Hors ligne"
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading_spinner} />
        <p>Chargement des amis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Erreur : {error}</p>
        <button onClick={loadFriends} className={styles.form_button}>Réessayer</button>
      </div>
    )
  }
  
  if (selectedFriend) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={styles.view_container}
      >
        
        <h3 className={styles.view_title}>Dashboard de {selectedFriend.username}</h3>
        
        <div className={styles.friend_dashboard}>
          <div className={styles.friend_header}>
            <div className={styles.friend_avatar_large}>
              {selectedFriend.avatar}
            </div>
            <h4 className={styles.friend_name}>{selectedFriend.username}</h4>
            <div className={styles.friend_status_badge} style={{ color: getStatusColor(selectedFriend.status) }}>
              <span className={styles.status_dot} style={{ backgroundColor: getStatusColor(selectedFriend.status) }} />
              {getStatusText(selectedFriend.status)}
            </div>
          </div>
          
          <div className={styles.stats_grid_mini}>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.score}</p>
              <p className={styles.stat_mini_label}>Score</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.wins}</p>
              <p className={styles.stat_mini_label}>Victoires</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.losses}</p>
              <p className={styles.stat_mini_label}>Défaites</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.draws}</p>
              <p className={styles.stat_mini_label}>Nuls</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.gamesPlayed}</p>
              <p className={styles.stat_mini_label}>Parties</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{selectedFriend.winRate.toFixed(1)}%</p>
              <p className={styles.stat_mini_label}>Taux victoire</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>#{selectedFriend.rank}</p>
              <p className={styles.stat_mini_label}>Rang</p>
            </div>
          </div>
          
          {selectedFriend.status === "online" && (
            <button
              className={`${styles.action_button} ${styles.action_green}`}
              onClick={() => alert("Invitation envoyée à " + selectedFriend.username)}
            >
              <div className={styles.action_icon_wrapper}>
                <Gamepad2 className={styles.action_icon} />
              </div>
              <span className={styles.action_label}>Inviter à jouer</span>
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={styles.view_container}
    >
      <div className={styles.friends_header}>
        <h3 className={styles.view_title}>Gérer mes amis</h3>
        <button
          onClick={() => {
            setShowAddFriend(!showAddFriend)
            setSearchQuery("")
          }}
          className={`${styles.icon_button} ${showAddFriend ? styles.icon_button_active : ''}`}
          title={showAddFriend ? "Fermer" : "Ajouter un ami"}
        >
          {showAddFriend ? <X size={20} /> : <UserPlus size={20} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showAddFriend ? (
          <motion.div
            key="add-friends"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.search_bar}>
              <Search className={styles.search_icon} size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un joueur..."
                className={styles.search_input}
              />
            </div>
            <div className={styles.friends_list}>
              <p className={styles.section_label}>Joueurs disponibles</p>
              {isSearching ? (
                <div className={styles.loading}>
                  <div className={styles.loading_spinner} />
                  <p>Recherche...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((player) => (
                  <motion.div
                    key={player.id}
                    className={styles.friend_item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className={styles.friend_avatar}>
                      {player.avatar}
                    </div>
                    <div className={styles.friend_info}>
                      <p className={styles.friend_username}>{player.username}</p>
                      <p className={styles.friend_meta}>Disponible</p>
                    </div>
                    <button
                      className={`${styles.form_button} ${styles.form_button_primary}`}
                      onClick={() => handleSendRequest(player.id)}
                    >
                      <UserPlus size={16} />
                      Ajouter
                    </button>
                  </motion.div>
                ))
              ) : searchQuery.trim() ? (
                <p className={styles.empty_message}>Aucun joueur trouvé</p>
              ) : (
                <p className={styles.empty_message}>Entrez un nom d'utilisateur pour rechercher</p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="friends-sections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Section Demandes d'amis */}
            {friendRequests.length > 0 && (
              <div className={styles.collapsible_section}>
                <button
                  onClick={() => setShowRequestsSection(!showRequestsSection)}
                  className={styles.section_header}
                >
                  <span className={styles.section_arrow}>{showRequestsSection ? '▽' : '▷'}</span>
                  <span className={styles.section_title}>Demandes ({friendRequests.length})</span>
                  {friendRequests.length > 0 && (
                    <span className={styles.badge_inline}>{friendRequests.length}</span>
                  )}
                </button>
                <AnimatePresence>
                  {showRequestsSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={styles.section_content}
                    >
                      {friendRequests.map((request) => (
                        <div key={request.id} className={styles.friend_item}>
                          <div className={styles.friend_avatar}>
                            {request.avatar}
                          </div>
                          <div className={styles.friend_info}>
                            <p className={styles.friend_username}>{request.username}</p>
                            <p className={styles.friend_meta}>
                              {new Date().getTime() - new Date(request.createdAt).getTime() < 60000 ? "À l'instant" : "Récemment"}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className={`${styles.form_button} ${styles.form_button_primary}`}
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Accepter
                            </button>
                            <button
                              className={styles.form_button}
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Section Amis */}
            <div className={styles.collapsible_section}>
              <button
                onClick={() => setShowFriendsSection(!showFriendsSection)}
                className={styles.section_header}
              >
                <span className={styles.section_arrow}>{showFriendsSection ? '▽' : '▷'}</span>
                <span className={styles.section_title}>Amis ({friends.length})</span>
              </button>
              <AnimatePresence>
                {showFriendsSection && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={styles.section_content}
                  >
                    {friends.length > 0 ? (
                      <div className={styles.search_bar} style={{ marginBottom: '1rem' }}>
                        <Search className={styles.search_icon} size={18} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher un ami..."
                          className={styles.search_input}
                        />
                      </div>
                    ) : null}
                    {filteredFriends.length > 0 ? (
                      filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className={styles.friend_item}
                          onClick={() => loadFriendDetails(friend.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.friend_avatar_with_status}>
                            <div className={styles.friend_avatar}>
                              {friend.avatar}
                            </div>
                            <span
                              className={styles.status_dot_small}
                              style={{ backgroundColor: getStatusColor(friend.status) }}
                            />
                          </div>
                          <div className={styles.friend_info}>
                            <p className={styles.friend_username}>{friend.username}</p>
                            <p className={styles.friend_meta}>
                              {getStatusText(friend.status)} • Score: {friend.score}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : friends.length === 0 ? (
                      <p className={styles.empty_message}>Aucun ami pour le moment</p>
                    ) : (
                      <p className={styles.empty_message}>Aucun ami trouvé</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}



// Composant Profil
function ProfileView({ profile, stats }: { profile: UserProfile; stats: UserStats }) {
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)
      
      await userService.updateProfile(username, email)
      
      setSuccess(true)
      
      // Recharger la page après 1 seconde pour avoir les nouvelles données
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setUsername(profile.username)
    setEmail(profile.email)
    setError(null)
    setSuccess(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={styles.view_container}
    >
      <h3 className={styles.view_title}>Modifier mon profil</h3>
      
      <div className={styles.profile_form}>
        {/* Avatar */}
        <div className={styles.form_section}>

          <div className={styles.avatar_selector}>
            <div className={styles.avatar_large}>
              <Gamepad2 className={styles.avatar_icon} />
            </div>
          </div>
        </div>

        {/* Nom d'utilisateur */}
        <div className={styles.form_section}>
          <label className={styles.form_label} htmlFor="username">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSaving}
            className={styles.form_input}
            placeholder="Votre nom d'utilisateur"
          />
        </div>

        {/* Email */}
        <div className={styles.form_section}>
          <label className={styles.form_label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
            className={styles.form_input}
            placeholder="votre.email@exemple.com"
          />
        </div>

        {/* Statistiques */}
        <div className={styles.form_section}>
          <label className={styles.form_label}>Statistiques</label>
          <div className={styles.stats_grid_mini}>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.score}</p>
              <p className={styles.stat_mini_label}>Score</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.wins}</p>
              <p className={styles.stat_mini_label}>Victoires</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.losses}</p>
              <p className={styles.stat_mini_label}>Défaites</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.draws}</p>
              <p className={styles.stat_mini_label}>Nuls</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.gamesPlayed}</p>
              <p className={styles.stat_mini_label}>Parties</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>{stats.winRate.toFixed(1)}%</p>
              <p className={styles.stat_mini_label}>Taux victoire</p>
            </div>
            <div className={styles.stat_mini}>
              <p className={styles.stat_mini_value}>#{stats.rank}</p>
              <p className={styles.stat_mini_label}>Rang</p>
            </div>
          </div>
        </div>

        {/* Messages d'erreur et succès */}
        {error && (
          <div className={styles.form_error}>
            ⚠️ {error}
          </div>
        )}
        
        {success && (
          <div className={styles.form_success}>
            Profil mis à jour avec succès !
          </div>
        )}

        {/* Boutons */}
        <div className={styles.form_actions}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`${styles.form_button} ${styles.form_button_primary}`}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
