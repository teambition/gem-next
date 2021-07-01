import * as Koa from 'koa'
import * as http from 'http'
export const app = new Koa()
export const httpServer = http.createServer(app.callback())
export default httpServer
