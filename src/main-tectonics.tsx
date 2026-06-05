import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tectonics.css'
import { AppErrorBoundary } from './tectonics/ui/AppErrorBoundary'
import { TectonicsApp } from './tectonics/TectonicsApp'

document.documentElement.style.background = '#020408'
document.body.style.background = '#020408'
document.body.style.margin = '0'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <TectonicsApp />
    </AppErrorBoundary>
  </StrictMode>,
)
