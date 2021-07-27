import { } from 'koa'
import { Transform } from 'stream'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, middleware, post, responseStream, validator } from '../http-server/decorator'
import recordBll from '../bll/record'
import recordAuthBll from '../bll/record-auth'
import { RecordData } from '../interface/record'

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

// const pipelinePromise = promisify(pipeline)

@controller('/record')
@before(async (ctx) => {
  let token = ctx.get('authorization') as string || ''
  token = token.replace(/^Bearer /, '')
  const { spaceId, entityId } = ctx.request.body as any
  recordAuthBll.verify({ spaceId, entityId, token })
})
@after(async ctx => {
  console.log('req', ctx.method, ctx.url, ctx.status, ctx.state)
})
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @responseStream(() => {
    return new Transform({
      // readableObjectMode: true,
      objectMode: true,
      transform(record: RecordData, _, cb) {
        const data = JSON.stringify(record) + '\n'
        cb(null, data)
      }
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
  async queryArray(request: RecordQueryRequest) {
    const resp = await this.query(request)
    const result = []
    for await (const doc of resp) {
      result.push(doc)
    }

    return result
  }

  @post('/create')
  async create({ spaceId, entityId, cf }: RecordCreateRequest) {
    const resp = await this.recordBll.create({
      spaceId: spaceId,
      entityId: entityId,
      cf: cf,
    })

    return resp
  }
}
