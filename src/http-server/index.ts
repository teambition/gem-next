import * as Koa from 'koa'
import * as koaBody from 'koa-bodyparser'
import * as http from 'http'
import router from './router'
import { loggerMW } from './logger'
import { errorHandlerMW } from './error-handler'

export const app = new Koa()
app.use(koaBody())
app.use(loggerMW())
app.use(errorHandlerMW())
app.use(router.routes())

export const httpServer = http.createServer(app.callback())
export default httpServer
