import { createContext, useContext, useRef } from "react"

export type SoundType = "move" | "win" | "lose"

const soundFiles: Record<SoundType, string> = {
  move: "/sounds/move.mp3",
  win: "/sounds/win.mp3",
  lose: "/sounds/lose.mp3"
}

interface SoundEffectsContextProps {
  play: (type: SoundType) => void
}

const SoundEffectsContext = createContext<SoundEffectsContextProps>({ play: () => {} })

export function useSoundEffects() {
  return useContext(SoundEffectsContext)
}

export function SoundEffectsProvider({ enabled, children }: { enabled: boolean, children: React.ReactNode }) {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    move: null,
    win: null,
    lose: null
  })

  const play = (type: SoundType) => {
    console.log(`[SoundEffects] play called: type=${type}, enabled=${enabled}`)
    if (!enabled) return
    if (!audioRefs.current[type]) {
      console.log(`[SoundEffects] Creating audio element for ${type}`)
      audioRefs.current[type] = new window.Audio(soundFiles[type])
    }
    const audio = audioRefs.current[type]!
    audio.currentTime = 0
    audio.play().then(() => {
      console.log(`[SoundEffects] Playing sound: ${type}`)
    }).catch((err) => {
      console.warn(`[SoundEffects] Failed to play sound: ${type}`, err)
    })
  }

  return (
    <SoundEffectsContext.Provider value={{ play }}>
      {children}
    </SoundEffectsContext.Provider>
  )
}
