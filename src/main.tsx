import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── App Version Gate ────────────────────────────────────────────
// Bump this when a breaking change requires a fresh start.
// If the stored version doesn't match, all localStorage is wiped
// and the user goes through onboarding again.
const APP_VERSION = 3;
const STORED_VERSION = Number(localStorage.getItem('quest-app-version') || '0');

if (STORED_VERSION < APP_VERSION) {
  // Wipe everything except Supabase auth (which uses its own storage key)
  const authKey = Object.keys(localStorage).find(k => k.startsWith('sb-'));
  const authValue = authKey ? localStorage.getItem(authKey) : null;

  localStorage.clear();

  // Restore Supabase auth session so they don't have to re-login
  if (authKey && authValue) {
    localStorage.setItem(authKey, authValue);
  }

  localStorage.setItem('quest-app-version', String(APP_VERSION));
  console.log(`[Quest] Upgraded from v${STORED_VERSION} to v${APP_VERSION} — localStorage wiped`);
}
// ────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
