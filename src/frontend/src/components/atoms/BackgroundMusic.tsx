import { useEffect, useRef } from "react"

interface BackgroundMusicProps {
  enabled: boolean
  volume?: number // 0.0 à 1.0
}

export function BackgroundMusic({ enabled, volume = 0.08 }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const retryPlayRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      console.log("[BackgroundMusic] Creating audio element for BGM")
      audioRef.current = new window.Audio("/sounds/bgm.mp3")
      audioRef.current.loop = true
      audioRef.current.volume = volume
    }
    const audio = audioRef.current
    let userInteractionListener: (() => void) | null = null
    if (enabled) {
      audio.play()
        .then(() => {
          console.log("[BackgroundMusic] Playing BGM")
        })
        .catch((err) => {
          console.warn("[BackgroundMusic] Failed to play BGM", err)
          // Si l'autoplay est bloqué, attendre une interaction utilisateur
          if (err && err.name === "NotAllowedError") {
            userInteractionListener = () => {
              audio.play().then(() => {
                console.log("[BackgroundMusic] Playing BGM after user interaction")
                window.removeEventListener("pointerdown", userInteractionListener!)
              }).catch((e) => {
                console.warn("[BackgroundMusic] Still failed after interaction", e)
              })
            }
            window.addEventListener("pointerdown", userInteractionListener)
          }
        })
    } else {
      audio.pause()
      audio.currentTime = 0
      console.log("[BackgroundMusic] Paused BGM")
    }
    return () => {
      audio.pause()
      audio.currentTime = 0
      if (userInteractionListener) {
        window.removeEventListener("pointerdown", userInteractionListener)
      }
      console.log("[BackgroundMusic] Cleanup: Paused BGM")
    }
  }, [enabled, volume])

  return null
}
