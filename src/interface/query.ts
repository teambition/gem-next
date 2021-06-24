export interface QueryResult<T> {
  result: T[]
  nextPageToken?: string
}
