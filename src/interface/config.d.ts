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
  }

  const config: Config
  export = config
}
