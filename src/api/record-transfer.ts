import { after, before, controller, MiddlewareFn, post, state, validateState } from '@tng/koa-controller'
import { MongodbCollectionRecordTransferBllImpl } from '../bll/mongodb-collection-engine/record-transfer'
import { authMW } from '../bll/auth'

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
@state()
@before(authMW())
export class RecordTransferAPI {
  private recordTransferBll = new MongodbCollectionRecordTransferBllImpl()

  @post('/transfer')
  @validateState({
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
