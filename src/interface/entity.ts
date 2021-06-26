import { QueryResult } from './query'

export interface Entity {
  id: string
  name: string
  spaceId: string
  storageEngineId: string
  labels: string[]
  updateTime: Date
  createTime: Date
}

export type CreateEntity = Partial<Pick<Entity, 'storageEngineId' | 'labels'>> & Pick<Entity, 'name' | 'spaceId'>
// export interface CreateEntity {
//   name: string
//   spaceId: string
//   storageEngineId?: string
//   labels?: string[]
// }
export interface UpdateEntity {
  id: string
  spaceId: string
  name?: string
  removeLabels?: string[]
  setLabels?: string[]
  addLabels?: string[]
}

export interface RemoveEntity {
  id: string
  spaceId: string
}

export interface ListEntity {
  spaceId: string
  limit?: number
  skip?: number
}

export interface EntityBll {
  create(createEntity: CreateEntity): Promise<Entity>
  list(listEntity: ListEntity): Promise<QueryResult<Entity>>
  update(updateEntity: UpdateEntity): Promise<Entity>
  remove(removeEntity: RemoveEntity): Promise<boolean>
}
