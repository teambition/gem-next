import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, FindCursor as MongodbCursor, Db as MongodbDatabase, MongoClient } from 'mongodb'
import { RecordData } from '../../interface/record'
import { transform, decodeBsonQuery } from './util'
import { RecordQueryBll, RecordQuery } from '../../interface/record-query'
import dbClient from '../../service/mongodb'

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

  async query({ filter, sort, spaceId, entityId, limit, skip = 0 }: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
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
        return Object.assign(r, { [k]: sortOrder })
      }, {}))
    }
    if (skip) cursor.skip(skip)
    if (limit) cursor.limit(limit)

    // TODO: add time limit for query
    // cursor.maxTimeMS(1000)

    // cursor transform to RecordData
    return this.stream(cursor)
  }

  stream(cursor: MongodbCursor): AsyncIterable<RecordData> {
    const result = new StreamTransform({
      readableObjectMode: true,
      objectMode: true,
      transform(doc: any, _, cb) {
        cb(null, transform(doc))
      }
    })
    // cursor.pipe(transform)
    pipelinePromise(cursor.stream(), result).catch(err => {
      console.error(err)
      result.emit('error', err)
    })
    return result
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
