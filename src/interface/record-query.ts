import { QueryResult } from './query'
import { RecordData } from './record'

// TODO
export interface RecordQuery<FilterType, SortType> {
  spaceId: string
  entityId: string
  filter: FilterType
  // queryEngine?: string
  sort?: SortType
  skip?: number
  limit?: number
}

export interface RecordQueryBll<FilterType, SortType> {
  query(query: RecordQuery<FilterType, SortType>): Promise<AsyncIterable<RecordData>>
  count?(query: RecordQuery<FilterType, SortType>): Promise<number>
}
