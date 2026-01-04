"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface AvatarProps {
  src?: string
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  status?: "online" | "offline" | "in-game"
  className?: string
}

export function Avatar({ src, alt, size = "md", status, className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    "in-game": "bg-yellow-500",
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <motion.div
        className="relative w-full h-full rounded-full overflow-hidden bg-muted border-2 border-border"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {src ? (
          <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </motion.div>
      {status && (
        <motion.div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[status]}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        />
      )}
    </div>
  )
}
