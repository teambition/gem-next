import { QueryResult } from './query'

export interface Field {
  id: string
  spaceId: string
  labels: string[]
  entityId: string
  name: string
  fieldType: string
  fieldOptions: any
  updateTime: Date
  createTime: Date
}

export interface CreateField {
  name: string
  spaceId: string
  entityId: string
  labels?: string[]
}

export interface UpdateField {
  id: string
  spaceId: string
  entityId: string
  name?: string
  removeLabels?: string[]
  setLabels?: string[]
  addLabels?: string[]
  fieldOptions?: any
}

export interface RemoveField {
  id: string
  spaceId: string
  entityId: string
}

export interface ListField {
  spaceId: string
  entityId?: string
  limit?: number
  skip?: number
}

export interface FieldBll {
  create(createField: CreateField): Promise<Field>
  list(listField: ListField): Promise<QueryResult<Field>>
  update(updateField: UpdateField): Promise<Field>
  remove(removeField: RemoveField): Promise<boolean>
}
