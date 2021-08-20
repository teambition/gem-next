import { QueryResult } from './query'
import { RecordCustomfieldMap, RecordData } from './record'

export interface CreateRecord {
  id?: string
  spaceId: string
  entityId: string
  labels?: string[]
  cf: RecordCustomfieldMap
}

export interface UpdateRecord {
  id: string
  spaceId: string
  entityId: string
  update: any
  removeLabels?: string[]
  setLabels?: string[]
  addLabels?: string[]
  options?: any
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
  update(updateRecord: UpdateRecord): Promise<boolean>
  remove(removeRecord: RemoveRecord): Promise<boolean>
}
