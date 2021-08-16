import { Collection as MongodbCollection, MongoClient, Db as MongodbDatabase, ObjectId } from 'mongodb'
import dbClient from '../../service/mongodb'

export class MongodbCollectionRecordTransferBllImpl {
  private dbClient: MongoClient
  constructor(options: { dbClient?: MongoClient } = {}) {
    this.dbClient = options.dbClient || dbClient
  }

  private get db(): MongodbDatabase {
    return this.dbClient.db()
  }

  private get collection(): MongodbCollection {
    return this.db.collection('record')
  }

  /**
   * @deprecated Not Recommend to trasfer entity to another
   * @param opt 
   * @returns 
   */
  async transfer(opt: {
    id?: string
    sourceEntityId: string
    sourceSpaceId: string
    targetEntityId: string
    targetSpaceId: string
  }): Promise<any> {
    const conds: any = {
      entityId: opt.sourceEntityId,
      spaceId: opt.sourceSpaceId,
    }
    if (opt.id) { conds._id = new ObjectId(opt.id) }
    const resp = await this.collection.updateMany(conds, {
      entityId: opt.targetEntityId,
      spaceId: opt.targetSpaceId,
    })
    return resp.modifiedCount
  }
}

export default new MongodbCollectionRecordTransferBllImpl()
