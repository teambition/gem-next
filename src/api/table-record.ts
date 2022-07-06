import { } from 'koa'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, post } from '@tng/koa-controller'
import recordBll from '../bll/record'

interface RecordQueryRequest {
  spaceId: string
  entityId: string
  limit?: number
  skip?: number
  sort?: any
  filter?: any
  options?: any
}

interface RecordCreateRequest {
  spaceId: string
  entityId: string
  cf: {
    [x: string]: any
  }
  options?: any
}

interface RecordUpdateRequest {
  spaceId: string
  entityId: string
  id: string
  update: {
    [x: string]: any
  }
  options?: any
}

interface RecordRemoveRequest {
  spaceId: string
  entityId: string
  id: string
}

// @controller('/table-record')
// @after(async ctx => {
//   // console.log('req', ctx.method, ctx.url, ctx.status, ctx.state)
// })
export class TableRecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  async query({ spaceId, entityId, limit = 10, skip = 0, sort, filter }: RecordQueryRequest) {
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
  async queryArray({ spaceId, entityId, limit, skip, sort, filter }: RecordQueryRequest) {
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
  async create({ spaceId, entityId, cf }: RecordCreateRequest) {
    const resp = await this.recordBll.create({
      spaceId,
      entityId,
      cf,
    })

    return resp
  }

  @post('/update')
  async update({ spaceId, entityId, id, update, options }: RecordUpdateRequest) {
    const resp = await this.recordBll.update({
      spaceId,
      entityId,
      id,
      update,
      options,
    })

    return resp
  }

  @post('/remove')
  async remove({ spaceId, entityId, id }: RecordRemoveRequest) {
    const resp = await this.recordBll.remove({
      spaceId: spaceId,
      entityId: entityId,
      id: id,
    })

    return resp
  }
}
