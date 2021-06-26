import { Collection as MongodbCollection } from 'mongodb'
import { RecordData } from '../../interface/record'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../../interface/record-storage'

export class MongodbCollectionRecordStorageBllImpl implements RecordStorageBll {
  private collection: MongodbCollection
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
