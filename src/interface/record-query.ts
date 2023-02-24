import { RecordData, GroupDate } from './record'

export interface Options {
  maxTimeMs?: number
  hint?: string
  readPreference?: string
}
export interface RecordQuery<FilterType, SortType> {
  spaceId: string
  entityId: string
  filter: FilterType
  // queryEngine?: string
  sort?: SortType
  skip?: number
  limit?: number
  options?: any
}

export interface RecordAggregateByPatchSort<FilterType, SortType> {
  conds: FilterType
  addFields?: any
  sort?: SortType
  skip?: number
  limit?: number
  options?: any
}

export interface RecordGroup<FilterType, SortType> {
  spaceId: string
  entityId: string
  filter: FilterType
  group?: Group
  sort?: SortType
  limit?: number
  options?: any
}

export interface Group {
  groupField?: string
  aggField?: string
  aggFunc?: 'sum' | 'count' | 'avg' | 'max' | 'min'
}

export interface Sort {
  [key: string]: {
    falseField: string
    order: 1 | -1
  }
}

export interface RecordQueryBll<FilterType, SortType> {
  query(query: RecordQuery<FilterType, SortType>): Promise<AsyncIterable<RecordData>>
  count?(query: RecordQuery<FilterType, SortType>): Promise<number>
  group?(query: RecordGroup<FilterType, SortType>): Promise<AsyncIterable<GroupDate>>
}
