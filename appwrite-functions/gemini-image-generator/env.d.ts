declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY: string;
      GEMINI_MODEL?: string;
    }
  }
}

export {};
