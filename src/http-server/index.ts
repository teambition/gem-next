import * as Koa from 'koa'
import * as koaBody from 'koa-bodyparser'
import * as createError from 'http-errors'
import * as http from 'http'
import router from './router'
import { loggerMW } from './logger'
import { errorHandlerMW } from './error-handler'

export const app = new Koa()
app.use(koaBody())
app.use(loggerMW())
app.use(errorHandlerMW())
app.use(router.routes())
app.use((ctx) => {
  if (!ctx.matched.length) throw createError(404, 'api not found')
})

export const httpServer = http.createServer(app.callback())
export default httpServer
