import { Context } from 'koa'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import recordBll from '../bll/record'

export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  async query (ctx: Context) {
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

    ctx.body = result

  }

  async create (ctx: Context) {
    const resp = await this.recordBll.create({
      spaceId: '1',
      entityId: '2',
      cf: {
        'abc': 123,
      }
    })

    ctx.body = resp

  }
}

export default new RecordAPI()
