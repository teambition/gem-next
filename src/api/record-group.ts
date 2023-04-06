import * as createHttpError from 'http-errors'

import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { before, after, controller, MiddlewareFn, post, state, validateState } from '@tng/koa-controller'
import recordBll from '../bll/record'
import { authMW } from '../bll/auth'
import { checkEntityRateLimitMW } from '../bll/server-ratelimit'
import { GroupDate } from '../interface/record'
import { Group } from '../interface/record-query'

interface RecordGroupQueryRequest {
  spaceId: string
  entityId: string
  filter?: any
  options?: any
  group?: Group
  sort?: {[x: string]: 1 | -1 }
  limit?: number
}

export function resultMW(): MiddlewareFn {
  return async (ctx) => {
    ctx.body = { result: ctx.body }
  }
}

@controller('/api/record')
@state()
@before(authMW())
export class RecordGroupAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/group')
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      filter: { type: 'object' },
      group: {
        type: 'object',
        properties: {
          groupField: { type: 'string' },
          aggField: { type: 'string' },
          aggFunc: { type: 'string', enum: ['sum', 'count', 'avg', 'max', 'min'] }
        }
      },
      sort: { type: 'object' },
      limit: { type: 'number' },
      options: { type: 'object' },
    },
  })
  @before(checkEntityRateLimitMW())
  @before(async (ctx) => {
    const { group } = ctx.request.body as any
    for (const key in group) {
      if (group[key]?.includes('$')) throw createHttpError(400, `invalid ${key}`)
    }
  })
  @after(resultMW())
  async group({spaceId, entityId, group, sort, limit, filter, options}: RecordGroupQueryRequest) {
    const resp = await this.recordBll.group({ spaceId, entityId, group, sort, limit, filter, options })
    const records: GroupDate[] = []
    for await (const doc of resp) {
      records.push(doc)
    }
    return records
  }
}
