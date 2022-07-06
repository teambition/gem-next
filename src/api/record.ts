import { Context } from 'koa'
import { promisify } from 'util'
import { Transform, pipeline } from 'stream'
import * as createHttpError from 'http-errors'
import * as config from 'config'
import { RecordQueryBll } from '../interface/record-query'
import { RecordStorageBll } from '../interface/record-storage'
import { after, before, controller, middleware, MiddlewareFn, post, state, validateState } from '@tng/koa-controller'
import recordBll from '../bll/record'
import recordAuthBll from '../bll/record-auth'
import { RecordData } from '../interface/record'
import { encodeBsonValue } from '../bll/mongodb-collection-engine/util'
import { createLogger } from '../service/logger'
import { authMW } from '../bll/auth'


const logger = createLogger({ label: 'record-api' })
const pipelinePromise = promisify(pipeline)
const maxResultWindow = config.MONGODB_QUERY_OPTIONS?.maxResultWindow || 10000

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
  id?: string
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
  options?: any
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
@state()
@before(authMW())
export class RecordAPI {
  private recordBll: RecordStorageBll & RecordQueryBll<any, any>

  constructor(options: { recordBll?: RecordStorageBll & RecordQueryBll<any, any> } = {}) {
    this.recordBll = options.recordBll || recordBll
  }

  @post('/query')
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      filter: { type: 'object' },
      sort: { type: 'object' },
      skip: { type: 'integer', minimum: 0, default: 0 },
      limit: { type: 'integer', minimum: 0, default: 10 },
      disableBsonEncode: { type: 'boolean', default: false },
    }
  })
  @before(async (ctx) => {
    const { skip, limit } = ctx.request.body as any
    if (skip + limit > maxResultWindow) {
      throw createHttpError(400, `Result window is too large, skip + limit must be less than or equal to:[${maxResultWindow}] but was [${skip + limit}]`)
    }
  })
  @after(async (ctx) => {
    if (ctx.state.disableBsonEncode) return
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
      logger.error(err, 'pipeline-error')
    })
  })
  async query({ spaceId, entityId, limit = 10, skip = 0, sort, filter, options }: RecordQueryRequest) {
    const resp = await this.recordBll.query({
      spaceId,
      entityId,
      limit,
      skip,
      sort,
      filter,
      options,
    })

    return resp
  }

  @post('/query-array')
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      filter: { type: 'object' },
      sort: { type: 'object' },
      skip: { type: 'integer', minimum: 0, default: 0 },
      limit: { type: 'integer', minimum: 0, default: 10 },
      options: { type: 'object' },
      disableBsonEncode: { type: 'boolean', default: false },
    }
  })
  @before(async (ctx) => {
    const { skip, limit } = ctx.request.body as any
    if (skip + limit > maxResultWindow) {
      throw createHttpError(400, `Result window is too large, skip + limit must be less than or equal to:[${maxResultWindow}] but was [${skip + limit}]`)
    }
  })
  @after(async (ctx) => {
    if (ctx.state.disableBsonEncode) return
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
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      id: { type: 'string' },
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      cf: { type: 'object' },
      options: { type: 'object' },
    }
  })
  @after(resultMW())
  async create({ spaceId, entityId, cf, id }: RecordCreateRequest) {
    const record = await this.recordBll.create({
      id,
      spaceId: spaceId,
      entityId: entityId,
      cf: cf,
    })

    return record
  }

  @post('/update')
  @validateState({
    type: 'object',
    required: ['id', 'spaceId', 'entityId', 'update'],
    properties: {
      id: { type: 'string' },
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      update: { type: 'object' },
      options: { type: 'object' },
    }
  })
  @after(resultMW())
  async update({ spaceId, entityId, id, update, options }: RecordUpdateRequest) {
    const result = await this.recordBll.update({
      spaceId,
      entityId,
      id,
      update,
      options,
    })

    return result
  }

  @post('/remove')
  @validateState({
    type: 'object',
    required: ['id', 'spaceId', 'entityId'],
    properties: {
      id: { type: 'string' },
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      options: { type: 'object' },
    }
  })
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
  @validateState({
    type: 'object',
    required: ['spaceId', 'entityId'],
    properties: {
      spaceId: { type: 'string' },
      entityId: { type: 'string' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: { options: { type: 'object' } },
        }
      }
    }
  })
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
