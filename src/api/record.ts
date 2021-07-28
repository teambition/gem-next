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

const pipelinePromise = promisify(pipeline)

interface RecordQueryRequest {
  spaceId: string
  entityId: string
  limit?: number
  skip?: number
  sort?: any
  filter?: any
}

interface RecordCreateRequest {
  spaceId: string
  entityId: string
  cf: {
    [x: string]: any
  }
}

interface RecordUpdateRequest {
  spaceId: string
  entityId: string
  id: string
  update: {
    [x: string]: any
  }
}

interface RecordRemoveRequest {
  spaceId: string
  entityId: string
  id: string
}

type BatchAction = { method: string } & RecordQueryRequest & RecordCreateRequest & RecordUpdateRequest & RecordRemoveRequest

interface BatchRequest {
  spaceId: string
  entityId: string
  actions: BatchAction[]
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
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @after(async (ctx) => {
    const origin: AsyncIterable<RecordData> = ctx.body as any
    const target = new Transform({
      // readableObjectMode: true,
      objectMode: true,
      transform(record: RecordData, _, cb) {
        record = {...record, cf: Object.keys(record.cf).reduce((cf, key) => {
          cf[key] = encodeBsonValue(record.cf[key])
          return cf
        }, {})}
        const data = JSON.stringify(record) + '\n'
        cb(null, data)
      }
    })
    ctx.body = target
    pipelinePromise(origin, target).catch(err => {
      console.error(err)
    })
  })
  async query({ spaceId, entityId, limit = 10, skip = 0, sort, filter }: RecordQueryRequest) {
    const resp = await this.recordBll.query({
      spaceId,
      entityId,
      limit,
      skip,
      sort,
      filter,
    })

    return resp
  }

  @post('/query-array')
  @after(async (ctx) => {
    const records = ctx.body as RecordData[]
    ctx.body = records.map(record => {
      return {...record, cf: Object.keys(record.cf).reduce((cf, key) => {
        cf[key] = encodeBsonValue(record.cf[key])
        return cf
      }, {})}
    })
  })
  @after(resultMW())
  async queryArray(request: RecordQueryRequest) {
    const resp = await this.query(request)
    const records: RecordData[] = []
    for await (const doc of resp) {
      records.push(doc)
    }
    return records
  }

  @post('/create')
  @after(resultMW())
  async create({ spaceId, entityId, cf }: RecordCreateRequest) {
    const record = await this.recordBll.create({
      spaceId: spaceId,
      entityId: entityId,
      cf: cf,
    })

    return record
  }

  @post('/update')
  @after(resultMW())
  async update({ spaceId, entityId, id, update }: RecordUpdateRequest) {
    const result = await this.recordBll.update({
      spaceId: spaceId,
      entityId: entityId,
      id: id,
      update: update,
    })

    return result
  }

  @post('/remove')
  @after(resultMW())
  async remove({ spaceId, entityId, id }: RecordRemoveRequest) {
    const result = await this.recordBll.remove({
      spaceId: spaceId,
      entityId: entityId,
      id: id,
    })

    return result
  }

  @post('/batch')
  @after(resultMW())
  async batch({ spaceId, entityId, actions }: BatchRequest) {
    const result = await Promise.all(actions.map(async action => {
      try {
        switch (action.method) {
          case 'create': return await this.create({ ...action, entityId, spaceId })
          case 'update': return await this.update({ ...action, entityId, spaceId })
          case 'remove': return await this.remove({ ...action, entityId, spaceId })
          case 'queryArray': return await this.queryArray({ ...action, entityId, spaceId })
          default: throw new Error('invalid method: ' + action.method)
        }
      } catch (e) {
        return { status: e.status || 500, error: e.message }
      }
    }))
    return result
  }
}
