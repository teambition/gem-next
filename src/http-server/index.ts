import * as Koa from 'koa'
import * as koaBody from 'koa-bodyparser'
import * as http from 'http'
import router from './router'

export const app = new Koa()
app.use(koaBody())
app.use(router.routes())

export const httpServer = http.createServer(app.callback())
export default httpServer
