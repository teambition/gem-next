import { Middleware } from 'koa'
import { createLogger } from '../service/logger'
const logger = createLogger({ label: 'http-request' })

export function loggerMW(): Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    try {
      await next()
    } finally {
      if (!ctx.skipLogger) {
        logger.info({
          status: ctx.status,
          method: ctx.method,
          duration: Date.now() - start,
          url: ctx.originalUrl,
          userAgent: ctx.get('user-agent'),
        })
      }
    }
  }
}
