import * as config from 'config'
import httpServer, { app } from './http-server'
import { Log } from './service/log'

function logCtx (app, logger?) {
  const log = new Log(logger) 
  app.context.logger = log
}

// 直接运行
if (require.main === module) {
  logCtx(app)
  httpServer.listen(config.PORT, () => {
    console.log(`http serving ${config.PORT} ...`)
  })
}

// 引用
export function init (logger) {
  logCtx(app, logger)
  httpServer.listen(config.PORT, () => {
    console.log(`http serving ${config.PORT} ...`)
  })
}