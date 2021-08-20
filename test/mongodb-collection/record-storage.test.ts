import 'mocha'
import { strict as assert } from 'assert'
import * as sinon from 'sinon'
import { MongodbCollectionRecordStorageBllImpl } from '../../src/bll/mongodb-collection-engine/record-storage'

describe('mongodb-collection-engine/record-storage', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('record-storage.create()', async () => {

    const insertOne = sinon.fake.resolves({ insertedId: 'id-1' })

    const dbClient: any = {
      db () {
        return {
          collection: () => ({
            insertOne,
          })
        }
      }
    }

    const storage = new MongodbCollectionRecordStorageBllImpl({
      dbClient,
    })

    const result = await storage.create({
      entityId: '1',
      spaceId: '2',
      cf: {
        abc: 123
      }
    })

    assert.ok(result)
    assert.ok(result.id)
    assert.equal(result.cf.abc, 123)
    assert.equal(insertOne.callCount, 1)
    assert.equal(insertOne.args[0][0]['cf:abc'], 123)
  })

  it('record-storage.update()', async () => {

    const updateOne = sinon.fake.resolves({ modifiedCount: 1 })

    const dbClient: any = {
      db () {
        return {
          collection: () => ({
            updateOne,
          })
        }
      }
    }

    const storage = new MongodbCollectionRecordStorageBllImpl({
      dbClient,
    })

    const result = await storage.update({
      id: '123456789012345678901234',
      entityId: '1',
      spaceId: '2',
      update: {
        abc: 123
      }
    })

    assert.equal(result, true)
    assert.equal(updateOne.args[0][1].$set['cf:abc'], 123)
    assert.ok(!updateOne.args[0][2].upsert)
  })


  it('record-storage.remove()', async () => {

    const deleteOne = sinon.fake.resolves({ deletedCount: 1 })

    const dbClient: any = {
      db () {
        return {
          collection: () => ({
            deleteOne,
          })
        }
      }
    }

    const storage = new MongodbCollectionRecordStorageBllImpl({
      dbClient,
    })

    const result = await storage.remove({
      id: '123456789012345678901234',
      entityId: '1',
      spaceId: '2',
    })

    assert.equal(result, true)
    assert.equal(deleteOne.args[0][0].id.toString(), '123456789012345678901234')
  })
})
