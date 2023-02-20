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


export interface GroupDate {
  [x: string]: any
}
