import { RecordData } from '../interface/record'
import { CreateRecord, RecordStorageBll, RemoveRecord, UpdateRecord } from '../interface/record-storage'

export class RecordStorageBllImpl implements RecordStorageBll {
  private mongodbEngineRecordBll: RecordStorageBll
  async create(createRecord: CreateRecord): Promise<RecordData> {
    return this.mongodbEngineRecordBll.create(createRecord)
  }
  async update(updateRecord: UpdateRecord): Promise<RecordData> {
    return this.mongodbEngineRecordBll.update(updateRecord)
  }
  async remove(removeRecord: RemoveRecord): Promise<boolean> {
    return this.mongodbEngineRecordBll.remove(removeRecord)
  }
}
