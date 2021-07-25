import 'mocha'
// import _ from 'lodash'
import * as MemoryMongoDB from 'mongo-mock'
import { strict as assert } from 'assert'
import { MongodbCollectionRecordQueryBllImpl } from '../../src/bll/mongodb-collection-engine/record-query'

describe('mongodb-collection-engine/record-query', () => {
  it('record-query/query()', async () => {
    const { MongoClient } = MemoryMongoDB
    const client = await MongoClient.connect('mongodb://localhost:27017/unitest')
    const db = client.db()
    const bll = new MongodbCollectionRecordQueryBllImpl({
      dbClient: db,
    })
    const t = await bll.query({
      entityId: '2',
      spaceId: '1',
      filter: {}
    })

    console.log(t)
  })
})
