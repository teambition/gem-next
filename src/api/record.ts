import { Context } from 'koa'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import recordBll from '../bll/record'
import { after, before, controller, get, middleware, params, post } from '../http-server/decorator'

interface RecordQueryRequest {
  spaceId: string
  entityId: string
  limit?: number
  skip?: number
  sort?: any
  filter?: any
}

@controller('/record')
@after(async ctx => {
  console.log('req', ctx.method, ctx.url, ctx.status, ctx.state)
})
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @before(async (ctx) => {})
  async query ({ spaceId, entityId, limit, skip, sort, filter }: RecordQueryRequest) {
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
  async create () {
    const resp = await this.recordBll.create({
      spaceId: '1',
      entityId: '2',
      cf: {
        'abc': 123,
      }
    })

    return resp
  }
}

export default new RecordAPI()
