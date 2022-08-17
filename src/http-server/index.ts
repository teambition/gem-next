import * as Koa from 'koa'
import * as path from 'path'
import * as http from 'http'
import * as koaBody from 'koa-bodyparser'
import * as createError from 'http-errors'
import { getRouterSync } from '@tng/koa-controller'
import { loggerMW } from './logger'
import { errorHandlerMW } from './error-handler'
import { createLogger } from '../service/logger'

require('lib/services/redis') // 改为非强制依赖

export const app = new Koa()
app.use(koaBody())
app.use(loggerMW())
app.use(errorHandlerMW())
app.use(getRouterSync({
  files: path.resolve(__dirname, '../api/**/*.[jt]s'),
  logger: createLogger({ label: 'http-router' }),
}).routes())


app.use((ctx) => {
  if (!ctx.matched.length) throw createError(404, 'api not found')
})

export const httpServer = http.createServer(app.callback())
export default httpServer
