import { QueryResult } from './query'
import { RecordCustomfieldMap, RecordData } from './record'

export interface CreateRecord {
  spaceId: string
  entityId: string
  labels?: string[]
  cf: RecordCustomfieldMap
}

export interface UpdateRecord {
  id: string
  spaceId: string
  entityId: string
  removeLabels?: string[]
  setLabels?: string[]
  addLabels?: string[]
  RecordOptions?: any
  cf: RecordCustomfieldMap
}

export interface RemoveRecord {
  id: string
  spaceId: string
  entityId: string
}

// export interface ListRecord {
//   spaceId: string
//   entityId?: string
// }

export interface RecordStorageBll {
  create(createRecord: CreateRecord): Promise<RecordData>
  // list(listRecord: ListRecord): Promise<QueryResult<Record>>
  update(updateRecord: UpdateRecord): Promise<RecordData>
  remove(removeRecord: RemoveRecord): Promise<boolean>
}
