import { RecordData } from '../interface/record'
import { RecordQuery, RecordQueryBll } from '../interface/record-query'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../interface/record-storage'
import mongodbCollectionRecordStorageBll from './mongodb-collection-engine/record-storage'
import mongodbCollectionRecordQueryBll from './mongodb-collection-engine/record-query'

export class RecordBllImpl implements RecordStorageBll, RecordQueryBll<any, any> {
  private recordStorageBll: RecordStorageBll
  private recordQueryBll: RecordQueryBll<any, any>

  constructor(options: { recordStorageBll?: RecordStorageBll, recordQueryBll?: RecordQueryBll<any, any> } = {}) {
    this.recordStorageBll = options.recordStorageBll || mongodbCollectionRecordStorageBll
    this.recordQueryBll = options.recordQueryBll || mongodbCollectionRecordQueryBll
  }

  async create(createRecord: CreateRecord): Promise<RecordData> {
    // TODO: get query.entityId and find entity
    // TODO: get entity.engineId and find engine
    // TODO: get engineClass Info get queryEngine or storageEngine
    return this.recordStorageBll.create(createRecord)
  }

  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    // TODO: get query.entityId and find entity
    // TODO: get entity.engineId and find engine
    // TODO: get engineClass Info get queryEngine or storageEngine
    return this.recordStorageBll.update(updateRecord)
  }

  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    // TODO: get query.entityId and find entity
    // TODO: get entity.engineId and find engine
    // TODO: get engineClass Info get queryEngine or storageEngine
    return this.recordStorageBll.remove(removeRecord)
  }

  async query(query: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
    // TODO: get query.entityId and find entity
    // TODO: get entity.engineId and find engine
    // TODO: get engineClass Info get queryEngine or storageEngine
    return this.recordQueryBll.query(query)
  }
}

export default new RecordBllImpl()
