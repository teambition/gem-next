import { QueryResult } from './query'

export interface RecordCustomfieldMap {
  [x: string]: any
}

export interface RecordData {
  id: string
  spaceId: string
  labels: string[]
  entityId: string
  updateTime: Date
  createTime: Date
  cf: RecordCustomfieldMap
}

export interface CreateRecord {
  spaceId: string
  entityId: string
  labels?: string[]
  cf: RecordCustomfieldMap
}

// export interface UpdateRecord {
//   id: string
//   spaceId: string
//   entityId: string
//   name?: string
//   removeLabels?: string[]
//   setLabels?: string[]
//   addLabels?: string[]
//   RecordOptions?: any
// }

export interface RemoveRecord {
  id: string
  spaceId: string
  entityId: string
}

// export interface ListRecord {
//   spaceId: string
//   entityId?: string
// }

export interface RecordBll {
  create(createRecord: CreateRecord): Promise<RecordData>
  // list(listRecord: ListRecord): Promise<QueryResult<Record>>
  // update(updateRecord: UpdateRecord): Promise<Record>
  remove(removeRecord: RemoveRecord): Promise<boolean>
}
