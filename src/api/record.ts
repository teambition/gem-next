import { Context } from 'koa'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import recordBll from '../bll/record'
import { after, before, controller, get, middleware, post } from '../http-server/decorator'

@controller('/record')
@after(async ctx => {
  console.log('status:', ctx.method, ctx.url, ctx.status)
})
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @before(async (ctx) => {
  })
  async query (req: any) {
    const resp = await this.recordBll.query({
      spaceId: '1',
      entityId: '2',
      limit: 1,
      skip: 0,
      sort: {_id: -1},
      filter: {
        'cf:abc': 123
      }
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
