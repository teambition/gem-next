import { Middleware } from 'koa'

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
        console.error(e)
      }
    }
  }
}