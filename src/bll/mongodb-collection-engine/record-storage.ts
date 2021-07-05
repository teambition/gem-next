import { Collection as MongodbCollection, MongoClient, Db as MongodbDatabase } from 'mongodb'
import { RecordData } from '../../interface/record'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../../interface/record-storage'
import dbClient from '../../service/mongodb'

export class MongodbCollectionRecordStorageBllImpl implements RecordStorageBll {
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

  transform(doc: any): RecordData {
    return {
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
  }

  async create(createRecord: CreateRecord): Promise<RecordData> {
    const doc: Record<string, any> = {
      spaceId: createRecord.spaceId,
      entityId: createRecord.entityId,
      labels: createRecord.labels || [],
      createTime: new Date(),
      updateTime: new Date(),
    }
    for (const cfKey in createRecord.cf) {
      // TODO: value should be decode from bson
      const value = createRecord.cf[cfKey]
      doc['cf:' + cfKey] = value
    }
    const resp = await this.collection.insertOne(doc)
    doc.id = String(resp.insertedId)
    return this.transform(doc)
  }
  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    throw new Error('Not Implemented')
  }
  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    throw new Error('Not Implemented')
  }
}

export default new MongodbCollectionRecordStorageBllImpl()
