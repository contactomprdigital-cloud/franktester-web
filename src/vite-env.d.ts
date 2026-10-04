/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string | undefined
  readonly VITE_SUPABASE_ANON_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Definidos por public/boot.js (apertura de marca)
interface Window {
  __ftIntro?: boolean
  __ftAppReady?: () => void
}
