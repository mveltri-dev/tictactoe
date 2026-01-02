import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, User, Lock, Mail } from "lucide-react"
import { GameButton } from "@/components/atoms/GameButton"
import styles from "./LoginForm.module.css"

interface LoginFormProps {
  onLogin: (username: string, password: string) => void
  onClose: () => void
}

export function LoginForm({ onLogin, onClose }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal__decoration--top']} />
        <div className={styles['modal__decoration--bottom']} />

        <button onClick={onClose} className={styles.modal__close}>
          <X className={styles.modal__close_icon} />
        </button>

        <div className={styles.modal__content}>
          <div className={styles.modal__header}>
            <div className={styles.modal__avatar}>
              <User className={styles.modal__avatar_icon} />
            </div>
            <h2 className={styles.modal__title}>{isRegistering ? "Créer un compte" : "Bienvenue"}</h2>
            <p className={styles.modal__subtitle}>
              {isRegistering ? "Rejoignez la communauté EasiTicTacToe" : "Connectez-vous pour jouer contre vos amis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.form__field}>
              <label htmlFor="username" className={styles.form__label}>
                Nom d'utilisateur
              </label>
              <div className={styles.form__input_wrapper}>
                <User className={styles.form__icon} />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.form__input}
                  placeholder="Votre pseudo"
                  required
                />
              </div>
            </div>

            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.form__field}
              >
                <label htmlFor="email" className={styles.form__label}>
                  Email
                </label>
                <div className={styles.form__input_wrapper}>
                  <Mail className={styles.form__icon} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.form__input}
                    placeholder="votre@email.com"
                    required={isRegistering}
                  />
                </div>
              </motion.div>
            )}

            <div className={styles.form__field}>
              <label htmlFor="password" className={styles.form__label}>
                Mot de passe
              </label>
              <div className={styles.form__input_wrapper}>
                <Lock className={styles.form__icon} />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.form__input}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>

            <div className={styles.form__submit}>
              <GameButton type="submit" variant="primary" className={styles.form__submit_button}>
                {isRegistering ? "Créer mon compte" : "Se connecter"}
              </GameButton>
            </div>
          </form>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className={styles.footer__toggle}
            >
              {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
