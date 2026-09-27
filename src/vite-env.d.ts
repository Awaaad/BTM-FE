/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Prefix for API calls; see src/config.ts. */
  readonly VITE_API_BASE?: string
  /** Sub-folder the built app is served from. */
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
