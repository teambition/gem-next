import { QueryResult } from './query'
import { RecordData } from './record'

// TODO
interface RecordQuery<FilterType, SortType> {
  spaceId: string
  entityId: string
  filter: FilterType
  // queryEngine?: string
  sort?: SortType
  offset?: number
  limit?: number
}

export interface RecordQueryBll<FilterType, SortType> {
  query(query: RecordQuery<FilterType, SortType>): Promise<AsyncIterable<RecordData>>
}
