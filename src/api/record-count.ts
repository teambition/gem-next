import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, MiddlewareFn, post, validator } from '../http-server/decorator'
import recordBll from '../bll/record'
import recordAuthBll from '../bll/record-auth'

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
@before(async (ctx) => {
  let token = ctx.get('authorization') as string || ''
  token = token.replace(/^Bearer /, '')
  const { spaceId, entityId } = ctx.request.body as any
  recordAuthBll.verify({ spaceId, entityId, token })
})
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/count')
  @validator({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      filter: { type: 'object' },
    }
  })
  @after(resultMW())
  async count({filter, spaceId, entityId}: RecordCountQueryRequest) {
  const result = await this.recordBll.count({ spaceId, entityId, filter })
  return result
  }
}
