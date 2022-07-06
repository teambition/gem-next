import { MiddlewareFn } from '@tng/koa-controller'
import recordAuthBll from './record-auth'

export function authMW(): MiddlewareFn {
  return async (ctx) => {
    let token = ctx.get('authorization') as string || ''
    token = token.replace(/^Bearer /, '')
    const { spaceId, entityId } = ctx.request.body as any
    recordAuthBll.verify({ spaceId, entityId, token })
  }
}
