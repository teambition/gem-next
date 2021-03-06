import * as config from 'config'
import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, FindCursor as MongodbCursor, Db as MongodbDatabase, MongoClient } from 'mongodb'
import { RecordData } from '../../interface/record'
import { transform, decodeBsonQuery, decodeField } from './util'
import { RecordQueryBll, RecordQuery } from '../../interface/record-query'
import dbClient from '../../service/mongodb'
import { createLogger } from '../../service/logger'
const logger = createLogger({ label: 'mongodb-collection-engine' })

const pipelinePromise = promisify(pipeline)

export class MongodbCollectionRecordQueryBllImpl implements RecordQueryBll<any, any> {
  private dbClient: MongoClient
  constructor(options: { dbClient?: MongoClient } = {}) {
    this.dbClient = options.dbClient || dbClient
  }

  private get db(): MongodbDatabase {
    return this.dbClient.db()
  }

  private get collection(): MongodbCollection {
    return this.db.collection('record')
  }

  async query({ filter, sort, spaceId, entityId, limit, skip = 0, options = {} }: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
    // filter transform to mongo query condition
    let conds = decodeBsonQuery(filter || {})
    conds = Object.assign({
      spaceId,
      entityId,
    }, conds)
    const cursor = this.collection.find(conds)

    // TODO: this is unsafe to use user's sort as mongo sort directly
    if (sort) {
      cursor.sort(Object.keys(sort).reduce<Record<string, any>>((r, k) => {
        const sortOrder = sort[k] || 1
        return Object.assign(r, { [decodeField(k)]: sortOrder })
      }, {}))
    }
    if (skip) cursor.skip(skip)
    if (limit) cursor.limit(limit)

    // add time limit for query
    const maxTimeMs = options?.maxTimeMs || config.MONGODB_QUERY_OPTIONS?.maxTimeMs
    if (maxTimeMs) cursor.maxTimeMS(maxTimeMs)

    // add hint for query
    if (options?.hint) cursor.hint(options.hint)

    // cursor transform to RecordData
    return this.stream(cursor)
  }

  private stream(cursor: MongodbCursor): AsyncIterable<RecordData> {
    const result = new StreamTransform({
      readableObjectMode: true,
      objectMode: true,
      transform(doc: any, _, cb) {
        cb(null, transform(doc))
      }
    })
    // cursor.pipe(transform)
    pipelinePromise(cursor.stream(), result).catch(err => {
      logger.error(err)
      result.emit('error', err)
    })
    return result
  }

  async count({ filter, spaceId, entityId, options }: RecordQuery<any, any>): Promise<number> {
    let conds = decodeBsonQuery(filter || {})
    conds = Object.assign({
      spaceId,
      entityId,
    }, conds)

    const result = await this.collection.countDocuments(conds, Object.assign({}, config.MONGODB_QUERY_OPTIONS, options))
    return result
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
