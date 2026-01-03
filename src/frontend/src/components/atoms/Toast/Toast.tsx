import { motion } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react"
import styles from "./Toast.module.css"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info"

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  onClose: (id: string) => void
}

export function Toast({ id, message, type, onClose }: ToastProps) {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className={styles.toast__icon} />
      case "error":
        return <XCircle className={styles.toast__icon} />
      case "info":
        return <AlertCircle className={styles.toast__icon} />
    }
  }

  return (
    <motion.div
      className={cn(styles.toast, styles[`toast--${type}`])}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {getIcon(type)}
      <p className={styles.toast__message}>{message}</p>
      <button className={styles.toast__close} onClick={() => onClose(id)}>
        <X size={16} />
      </button>
    </motion.div>
  )
}
