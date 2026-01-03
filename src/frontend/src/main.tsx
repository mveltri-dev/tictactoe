import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './pages/App'
import { ThemeProvider } from './contexts'
import './styles/globals.css'

console.log("🚀 main.tsx - Début du montage de l'application")
console.log("🔍 Root element:", document.getElementById('root'))

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error("Element #root introuvable !")
  }
  
  console.log("✅ Root element trouvé, création de la racine React...")
  const root = createRoot(rootElement)
  
  console.log("✅ Racine créée, montage de l'application...")
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
  console.log("✅ Application montée avec succès !")
} catch (error) {
  console.error("❌ ERREUR lors du montage de l'application:", error)
}


