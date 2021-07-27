import { Middleware } from 'koa'

export function errorHandlerMW(): Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (e) {
      ctx.status = e.status || 500
      ctx.body = {
        error: e.message
      }
    }
  }
}