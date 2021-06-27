import { RecordData } from '../interface/record'
import { RecordQuery, RecordQueryBll } from '../interface/record-query'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../interface/record-storage'

export class RecordBllImpl implements RecordStorageBll, RecordQueryBll<any, any> {
  private recordStorageBll: RecordStorageBll
  private recordQueryBll: RecordQueryBll<any, any>

  async create(createRecord: CreateRecord): Promise<RecordData> {
    return this.recordStorageBll.create(createRecord)
  }
  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    return this.recordStorageBll.update(updateRecord)
  }
  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    return this.recordStorageBll.remove(removeRecord)
  }
  async query(query: RecordQuery<any, any>): Promise<AsyncIterable<RecordData>> {
    return this.recordQueryBll.query(query)
  }
}
