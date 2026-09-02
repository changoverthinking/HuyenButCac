import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes/festival-themes.css'
import './app-enhancements.css'
import './media-fixes.css'
import './features/tieu-nhi/tieu-nhi.css'
import App from './App.tsx'
import { TieuNhiLauncher } from './features/tieu-nhi/TieuNhiLauncher.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TieuNhiLauncher />
  </StrictMode>,
)
