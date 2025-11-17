/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_PAGES_COLLECTION_ID: string
  readonly VITE_APPWRITE_ITEMS_COLLECTION_ID: string
  readonly VITE_APPWRITE_FILES_BUCKET_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
