declare global {
  interface Window {
    handleGameModeChange?: (mode: string) => void;
  }
}
export {};