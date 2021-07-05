import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, Cursor as MongodbCursor, Db as MongodbDatabase, MongoClient } from 'mongodb'
import { RecordData } from '../../interface/record'
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

  async query(query: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
    // TODO: it is unsafe to use user's filter as mongo query condition directly
    const conds = Object.assign({}, query.filter, {
      spaceId: query.spaceId,
      entityId: query.entityId,
    })
    const cursor = this.collection.find(conds)
    // TODO: this is unsafe to use user's sort as mongo sort directly
    if (query.sort) {
      cursor.sort(Object.keys(query.sort).reduce<Record<string, any>>((r, k) => {
        const sortOrder = query.sort[k] || 1
        if (k === 'id') k = '_id'
        return Object.assign(r, { [k]: sortOrder })
      }, {}))
    }
    if (query.skip) cursor.skip(query.skip)
    if (query.limit) cursor.limit(query.limit)

    // TODO: cursor has invalid Schema for RecordData should be transform in a pipe
    return this.transform(cursor)
  }

  transform(cursor: MongodbCursor): AsyncIterable<RecordData> {
    const transform = new StreamTransform({
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
        cb(null, data)
      }
    })
    pipelinePromise(cursor, transform).catch(err => {
      console.error(err)
      transform.emit('error', err)
    })
    return transform
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
