import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes/festival-themes.css'
import './app-enhancements.css'
import './media-fixes.css'
import './hotfix-tangthu-mobile.css'
import './metaphysics.css'
import App from './App.tsx'
import { HuyenHocBridge } from './components/metaphysics/HuyenHocBridge.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <HuyenHocBridge />
  </StrictMode>,
)
