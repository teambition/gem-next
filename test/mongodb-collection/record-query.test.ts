import 'mocha'
// import _ from 'lodash'
// import * as MemoryMongoDB from 'mongo-mock'
import * as MemoryMongoDB from '../memory-mongo-client'
import { strict as assert } from 'assert'
import { MongodbCollectionRecordQueryBllImpl } from '../../src/bll/mongodb-collection-engine/record-query'

describe('mongodb-collection-engine/record-query', () => {
  beforeEach(() => {
    MemoryMongoDB.replaceCollection('record', [])
  })
  it('record-query/query()', async () => {
    const { MongoClient } = MemoryMongoDB
    const client: any = await MongoClient.connect('mongodb://localhost:27017/unitest')
    const bll = new MongodbCollectionRecordQueryBllImpl({
      dbClient: client,
    })

    MemoryMongoDB.replaceCollection('record', [
      { entityId: '2', spaceId: '1', _id: 'id-1', createTime: new Date(), updateTime: new Date() },
      { entityId: '2', spaceId: '1', _id: 'id-2', createTime: new Date(), updateTime: new Date() },
      { entityId: '2', spaceId: '1', _id: 'id-3', createTime: new Date(), updateTime: new Date() },
    ])

    const cursor = await bll.query({
      entityId: '2',
      spaceId: '1',
      filter: {},
      sort: { id: -1 },
      limit: 10,
      skip: 1,
    })

    const result = []
    for await (const doc of cursor) {
      result.push(doc)
    }
    assert.equal(result.length, 2)
  })
})
