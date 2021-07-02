import * as Koa from 'koa'
import * as http from 'http'
import router from './router'

export const app = new Koa()
export const httpServer = http.createServer(app.callback())
app.use(router.routes())

export default httpServer
