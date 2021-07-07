import { Collection as MongodbCollection, MongoClient, Db as MongodbDatabase } from 'mongodb'
import { RecordData } from '../../interface/record'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../../interface/record-storage'
import dbClient from '../../service/mongodb'
import { transform } from './util'

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
    const labels = createRecord.labels || []
    const labelSet = new Set<string>()
    labels.forEach(label => labelSet.add(label))
    labelSet.add(`space:${createRecord.spaceId}`)
    labelSet.add(`entity:${createRecord.entityId}`)

    const doc: Record<string, any> = {
      spaceId: createRecord.spaceId,
      entityId: createRecord.entityId,
      labels: Array.from(labels),
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
    return transform(doc)
  }
  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    throw new Error('Not Implemented')
  }
  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    throw new Error('Not Implemented')
  }
}

export default new MongodbCollectionRecordStorageBllImpl()
