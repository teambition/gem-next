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

  async create(createRecord: CreateRecord): Promise<RecordData> {
    const doc: Record<string,any> = {
      spaceId: createRecord.spaceId,
      entityId: createRecord.entityId,
      labels: createRecord.labels || [],
    }
    for (const cfKey in createRecord.cf) {
      doc['cf:' + cfKey] = createRecord.cf[cfKey]
    }
    const resp = await this.collection.insertOne(doc)
    doc.id = String(resp.insertedId)
    return doc as any // TODO
  }
  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    throw new Error('Not Implemented')
  }
  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    throw new Error('Not Implemented')
  }
}

export default new MongodbCollectionRecordStorageBllImpl()
