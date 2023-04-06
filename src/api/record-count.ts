import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, MiddlewareFn, post, state, validateState } from '@tng/koa-controller'
import recordBll from '../bll/record'
import { authMW } from '../bll/auth'
import { checkEntityRateLimitMW } from '../bll/server-ratelimit'

interface RecordCountQueryRequest {
  spaceId: string
  entityId: string
  filter?: any
  options?: any
}

export function resultMW(): MiddlewareFn {
  return async (ctx) => {
    ctx.body = { result: ctx.body }
  }
}

@controller('/api/record')
@state()
@before(authMW())
export class RecordCountAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/count')
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      filter: { type: 'object' },
      options: { type: 'object' },
    },
  })
  @before(checkEntityRateLimitMW())
  @after(resultMW())
  async count({spaceId, entityId, filter, options}: RecordCountQueryRequest) {
    const result = await this.recordBll.count({ spaceId, entityId, filter, options })
    return result
  }
}
