import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, Cursor as MongodbCursor, Db as MongodbDatabase, MongoClient } from 'mongodb'
import { RecordData } from '../../interface/record'
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
      k = this.reservedKeys.includes(k) ? k : `cf:${k}`
      // TODO: value should be decode from bson
      return Object.assign(r, {[k]: filter[k]})
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
    return this.transform(cursor)
  }

  transform(cursor: MongodbCursor): AsyncIterable<RecordData> {
    const transform = new StreamTransform({
      readableObjectMode: true,
      objectMode: true,
      transform(doc: any, _, cb) {
        const data: RecordData = {
          id: String(doc._id),
          spaceId: String(doc.spaceId),
          entityId: String(doc.entityId),
          labels: doc.labels || [],
          createTime: new Date(doc.createTime),
          updateTime: new Date(doc.updateTime),
          cf: Object.keys(doc)
            .filter(key => /^cf:/.test(key))
            .reduce<{[x: string]: any}>((result, key) => {
              const cfKey = key.slice(3) // omit 'cf:'
              Object.assign(result, {[cfKey]: doc[key]})
              return result
            }, {})
        }
        this.push(data)
        cb()
      }
    })
    // cursor.pipe(transform)
    pipelinePromise(cursor, transform).catch(err => {
      console.error(err)
      transform.emit('error', err)
    })
    return transform
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
