import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, Cursor as MongodbCursor } from 'mongodb'
import { RecordData } from '../../interface/record'
import { RecordQueryBll, RecordQuery } from '../../interface/record-query'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../../interface/record-storage'

export class MongodbCollectionRecordQueryBllImpl implements RecordQueryBll<any, any> {
  private collection: MongodbCollection
  async query(query: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
    // TODO: it is unsafe to use user's filter as mongo query condition directly
    const conds = Object.assign({}, query.filter, {
      spaceId: query.spaceId,
      entitId: query.entityId,
    })
    const cursor = this.collection.find(conds)
    // TODO: this is unsafe to use user's sort as mongo sort directly
    if (query.sort) cursor.sort(query.sort)
    if (query.skip) cursor.skip(query.skip)
    if (query.limit) cursor.limit(query.limit)

    // TODO: cursor has invalid Schema for RecordData should be transform in a pipe
    return this.transform(cursor)
  }

  transform(cursor: MongodbCursor): AsyncIterable<RecordData> {
    const transform = new StreamTransform({
      objectMode: true,
      transform(chunk: any, _, cb) {
        const data: RecordData = {
          id: String(chunk._id),
          spaceId: String(chunk.spaceId),
          entityId: String(chunk.entityId),
          labels: chunk.labels || [],
          createTime: new Date(chunk.createTime),
          updateTime: new Date(chunk.updateTime),
          cf: Object.keys(chunk)
            .filter(key => /^cf:/.test(key))
            .reduce<{[x: string]: any}>((result, key) => {
              const cfKey = key.slice(3) // omit 'cf:'
              Object.assign(result, {[cfKey]: chunk[key]})
              return result
            }, {})
        }
        cb(null, data)
      }
    })
    return pipeline(cursor, transform)
  }
}
