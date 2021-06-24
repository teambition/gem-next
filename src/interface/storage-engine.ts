// import { QueryResult } from './query'

export interface StorageEngineData {
  engine: string
  version: string
  partitionType: string // data partition, collection partition, database partition
  engineClass: string
}

export interface StorageEngine {
  id: string
  labels: string[]
  data: StorageEngineData
  updateTime: Date
  createTime: Date
}

export interface CreateStorageEngine {
  data: any
  labels?: string[]
}

// export interface UpdateStorageEngine {
//   id: string
//   spaceId: string
//   name?: string
//   removeLabels?: string[]
//   setLabels?: string[]
//   addLabels?: string[]
// }

export interface RemoveStorageEngine {
  id: string
  spaceId: string
}

export interface FindStorageEngine {
  labels?: string[]
}

export interface StorageEngineBll {
  findOne(findStorageEngine: FindStorageEngine): Promise<StorageEngine>
  // create(createStorageEngine: CreateStorageEngine): Promise<StorageEngine>
  // list(listStorageEngine: ListStorageEngine): Promise<QueryResult<StorageEngine>>
  // update(updateStorageEngine: UpdateStorageEngine): Promise<StorageEngine>
  // remove(removeStorageEngine: RemoveStorageEngine): Promise<boolean>
}
