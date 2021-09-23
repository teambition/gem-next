import { Middleware } from 'koa'

export function loggerMW(): Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    try {
      await next()
    } finally {
      if (!ctx.skipLogger) {
        const payload = {
          class: 'request',
          timestamp: new Date().toISOString(),
          status: ctx.status,
          method: ctx.method,
          duration: Date.now() - start,
          url: ctx.originalUrl,
          userAgent: ctx.get('user-agent'),
        }
        console.log(JSON.stringify(payload))
      }
    }
  }
}