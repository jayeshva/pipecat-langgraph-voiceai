/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the voice backend. Defaults to http://localhost:8080. */
  readonly VITE_VOICE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
