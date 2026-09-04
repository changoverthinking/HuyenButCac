import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes/festival-themes.css'
import './app-enhancements.css'
import './media-fixes.css'
import './metaphysics.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/common/AppErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary area="Ứng dụng">
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
