import { Context } from 'koa'
import { promisify } from 'util'
import { Transform, pipeline } from 'stream'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, middleware, MiddlewareFn, post, validator } from '../http-server/decorator'
import recordBll from '../bll/record'
import recordAuthBll from '../bll/record-auth'
import { RecordData } from '../interface/record'
import { encodeBsonValue } from '../bll/mongodb-collection-engine/util'
import { MongodbCollectionRecordTransferBllImpl } from '../bll/mongodb-collection-engine/record-transfer'

interface RecordTransferRequest {
  id?: string
  spaceId: string
  entityId: string
  targetSpaceId: string
  targetEntityId: string
}
// const pipelinePromise = promisify(pipeline)

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
export class RecordTransferAPI {
  private recordTransferBll = new MongodbCollectionRecordTransferBllImpl()

  @post('/transfer')
  @validator({
    required: ['spaceId', 'entityId', 'targetSpaceId', 'targetEntityId'],
    properties: {
      id: { type: 'string' },
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      targetSpaceId: { type: 'string' },
      targetEntityId: { type: 'string' },
    }
  })
  @after(resultMW())
  async transfer({ id, spaceId: sourceSpaceId, entityId: sourceEntityId, targetSpaceId, targetEntityId, }: RecordTransferRequest) {
    const resp = await this.recordTransferBll.transfer({
      id,
      sourceSpaceId,
      sourceEntityId,
      targetSpaceId,
      targetEntityId,
    })

    return resp
  }
}
