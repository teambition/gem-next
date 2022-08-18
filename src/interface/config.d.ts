declare module 'config' {
  interface Config {
    HOST: string
    PORT: number
    DISABLE_DOC: boolean
    JWTKEYS: string[]
    MONGODB: {
      URL: string
      OPTIONS: { [x: string]: any }
    }
    LOGGERS: {
      base: Record<string, any>
      MONGODB: Record<string, any>
      HTTP: Record<string, any>
      [x: string]: Record<string, any>
    }
    MONGODB_QUERY_OPTIONS: { [x: string]: any }
    SERVER_RATELIMIT: { [x: string]: number }
    SERVER_RATELIMIT_RESET_INTERVAL_MS?: number
    SERVER_RATELIMIT_RETRY_INTERVAL_MS?: number
  }

  const config: Config
  export = config
}
