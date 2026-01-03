import { useState } from 'react'
import { authService } from '../../services/authService'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await authService.login(email, password)
      } else {
        await authService.register(username, email, password)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                placeholder="JohnDoe"
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">
              {isLogin ? 'Email ou nom d\'utilisateur' : 'Email'}
            </label>
            <input
              id="email"
              type={isLogin ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={isLogin ? 'john@example.com' : 'john@example.com'}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </form>

        <button
          className={styles.toggleButton}
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
          }}
        >
          {isLogin
            ? 'Pas encore de compte ? S\'inscrire'
            : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}
