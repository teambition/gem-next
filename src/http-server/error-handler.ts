import { Middleware } from 'koa'
import { createLogger } from '../service/logger'
const logger = createLogger({ label: 'http-error' })

export function errorHandlerMW(): Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (e) {
      const status = ctx.status = e.status || 500
      ctx.body = {
        error: e.message
      }
      if (status >= 500) {
        logger.error(Object.assign(e, {
          method: ctx.method,
          url: ctx.url,
          headers: ctx.headers,
          reqBody: JSON.stringify(ctx.request.body),
        }))
      }
    }
  }
}