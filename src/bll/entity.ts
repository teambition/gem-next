import { Collection as MongodbCollection, MongoClient, Db as MongodbDatabase, ObjectId } from 'mongodb'
import { CreateEntity, Entity, EntityBll, ListEntity, RemoveEntity, UpdateEntity } from '../interface/entity'
import { QueryResult } from '../interface/query'
import dbClient from '../service/mongodb'

export class EntityBllImpl implements EntityBll {
  private dbClient: MongoClient
  constructor(options: { dbClient?: MongoClient } = {}) {
    this.dbClient = options.dbClient || dbClient
  }
  private get db(): MongodbDatabase {
    return this.dbClient.db()
  }

  private get collection(): MongodbCollection<Omit<Entity, "id"> & { _id: ObjectId, isDeleted: boolean }> {
    return this.db.collection('entity')
  }

  private defaultStorageEngineId = ''

  async create(createEntity: CreateEntity): Promise<Entity> {
    const insertDoc: Omit<Entity, "id"> & { isDeleted: boolean } = {
      spaceId: createEntity.spaceId,
      name: createEntity.name,
      labels: createEntity.labels || [],
      storageEngineId: createEntity.storageEngineId || this.defaultStorageEngineId,
      createTime: new Date(),
      updateTime: new Date(),
      isDeleted: false,
    }

    // add default labels
    insertDoc.labels.push('space:' + insertDoc.spaceId)

    const resp = await this.collection.insertOne(insertDoc)

    return Object.assign({}, insertDoc, {
      id: String(resp.insertedId),
    })
  }
  async list(listEntity: ListEntity): Promise<QueryResult<Entity>> {
    const { spaceId, labels, limit } = listEntity
    const resp = await this.collection.find({
      spaceId,
      labels,
      isDeleted: false,
    }).toArray()
    const result = resp.map(({ name, spaceId, labels, storageEngineId, createTime, updateTime, _id }) => ({
      id: String(_id), name, spaceId, labels, storageEngineId, createTime, updateTime,
    }))
    return {
      result,
      nextPageToken: null
    }
  }
  async update(updateEntity: UpdateEntity): Promise<Entity> {
    // TODO
    // const doc = await this.collection.findOneAndUpdate({}, {
    //   $set: {

    //   }
    // }, { returnDocument: 'after' })
    throw new Error('Method not implemented.');
  }
  async remove(removeEntity: RemoveEntity): Promise<boolean> {
    const resp = await this.collection.updateOne({
      _id: new ObjectId(removeEntity.id),
      spaceId: removeEntity.spaceId,
      isDeleted: false,
    }, {
      $set: {
        updateTime: new Date(),
        isDeleted: true,
      }
    })
    return !!resp.modifiedCount
  }
}

export default new EntityBllImpl()
