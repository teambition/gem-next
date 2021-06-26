import { Collection as MongodbCollection, MongoClient, ObjectId } from 'mongodb'
import { CreateEntity, Entity, EntityBll, ListEntity, RemoveEntity, UpdateEntity } from '../interface/entity'
import { QueryResult } from '../interface/query';

export class EntityBllImpl implements EntityBll {
  private collection: MongodbCollection<Omit<Entity, "id"> & { _id: ObjectId }>
  private defaultStorageEngineId = ''

  constructor(db: MongoClient) {
    this.collection = db.db().collection('entity')
  }

  async create(createEntity: CreateEntity): Promise<Entity> {
    const insertDoc: Omit<Entity, "id"> = {
      spaceId: createEntity.spaceId,
      name: createEntity.name,
      labels: createEntity.labels || [],
      storageEngineId: createEntity.storageEngineId || this.defaultStorageEngineId,
      createTime: new Date(),
      updateTime: new Date(),
    }

    // add default labels
    insertDoc.labels.push('space:' + insertDoc.spaceId)

    const resp = await this.collection.insertOne(insertDoc)

    return Object.assign({}, insertDoc, {
      id: String(resp.insertedId),
    })
  }
  async list(listEntity: ListEntity): Promise<QueryResult<Entity>> {
    const { spaceId, limit } = listEntity
    const resp = await this.collection.find({
      spaceId: spaceId
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
    throw new Error('Method not implemented.');
  }
  async remove(removeEntity: RemoveEntity): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

}