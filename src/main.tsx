import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Motyw system-following (DESIGN.md/ADR-0029): scena „biuro w dzień ↔ kanapa
// wieczorem" wymusza light i dark jako równoprawne — klasa .dark na html podąża
// za prefers-color-scheme, bez ręcznego toggle'a (v1).
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
document.documentElement.classList.toggle('dark', prefersDark.matches)
prefersDark.addEventListener('change', (e) => {
  document.documentElement.classList.toggle('dark', e.matches)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
