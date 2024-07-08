import * as Koa from 'koa'
import * as path from 'path'
import * as http from 'http'
import * as koaBody from 'koa-bodyparser'
import * as createError from 'http-errors'
import { randomUUID } from 'crypto'
import { getRouterSync, traceMW, alsMW } from '@tng/koa-controller'
import { loggerMW } from './logger'
import { errorHandlerMW } from './error-handler'
import { createLogger } from '../service/logger'
import { als } from '../service/async-storage'
import { tracer } from '../service/jaeger'

export const app = new Koa()
app.use(alsMW(als))
app.use((ctx, next) => {
  ctx.response.set('x-request-id', ctx.get('x-request-id') || randomUUID())
  return next()
})
app.use(traceMW(tracer, { als }))
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
