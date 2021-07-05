import { } from 'koa'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, post, validator } from '../http-server/decorator'
import recordBll from '../bll/record'

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

// @controller('/record')
@after(async ctx => {
  console.log('req', ctx.method, ctx.url, ctx.status, ctx.state)
})
export class TableRecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @before(async (ctx) => {})
  // @validator({})
  async query ({ spaceId, entityId, limit = 10, skip = 0, sort, filter }: RecordQueryRequest) {
    const resp = await this.recordBll.query({
      spaceId,
      entityId,
      limit,
      skip,
      sort,
      filter,
    })

    const result = []
    for await (const doc of resp) {
      result.push(doc)
    }

    return result
  }

  @post('/query-array')
  async queryArray ({ spaceId, entityId, limit, skip, sort, filter }: RecordQueryRequest) {
    const resp = await this.recordBll.query({
      spaceId,
      entityId,
      limit,
      skip,
      sort,
      filter,
    })

    const result = []
    for await (const doc of resp) {
      result.push(doc)
    }

    return result
  }

  @post('/create')
  async create ({ spaceId, entityId, cf }: RecordCreateRequest) {
    const resp = await this.recordBll.create({
      spaceId: spaceId,
      entityId: entityId,
      cf: cf,
    })

    return resp
  }
}

export default new TableRecordAPI()
