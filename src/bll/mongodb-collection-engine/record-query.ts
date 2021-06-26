import { Collection as MongodbCollection } from 'mongodb'
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
    return cursor
  }
}
