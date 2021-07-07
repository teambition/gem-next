import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, Cursor as MongodbCursor, Db as MongodbDatabase, MongoClient } from 'mongodb'
import { RecordData } from '../../interface/record'
import { transform } from './util'
import { RecordQueryBll, RecordQuery } from '../../interface/record-query'
import dbClient from '../../service/mongodb'

const pipelinePromise = promisify(pipeline)

export class MongodbCollectionRecordQueryBllImpl implements RecordQueryBll<any, any> {
  private dbClient: MongoClient
  private reservedKeys = ['id', 'createTime', 'updateTime']
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
    // TODO: it is unsafe to use user's filter as mongo query condition directly
    filter = filter || {}
    const filterData = Object.keys(filter).reduce<Record<string, any>>((r, k) => {
      const value = filter[k]
      k = this.reservedKeys.includes(k) ? k : `cf:${k}`
      // TODO: value should be decode from bson
      return Object.assign(r, {[k]: value})
    }, {})
    const conds = Object.assign(filterData, {
      spaceId,
      entityId,
    })
    const cursor = this.collection.find(conds)
    // TODO: this is unsafe to use user's sort as mongo sort directly
    if (sort) {
      cursor.sort(Object.keys(sort).reduce<Record<string, any>>((r, k) => {
        const sortOrder = sort[k] || 1
        if (k === 'id') k = '_id'
        return Object.assign(r, { [k]: sortOrder })
      }, {}))
    }
    if (skip) cursor.skip(skip)
    if (limit) cursor.limit(limit)

    // TODO: cursor has invalid Schema for RecordData should be transform in a pipe
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
    pipelinePromise(cursor, result).catch(err => {
      console.error(err)
      result.emit('error', err)
    })
    return result
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
