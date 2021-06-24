import { QueryResult } from './query'
import { RecordData } from './record'

// TODO
interface RecordQuery {
  spaceId: string
  entityId: string
  filter: any
  sort?: any
  offset?: number
  limit?: number
}

export interface RecordQueryBll {
  query(query: RecordQuery): Promise<Iterable<RecordData>>
}
