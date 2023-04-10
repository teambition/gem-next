import * as config from 'config'
import { promisify } from 'util'
import { Transform as StreamTransform, pipeline } from 'stream'
import { Collection as MongodbCollection, FindCursor, Db as MongodbDatabase, MongoClient, AggregationCursor } from 'mongodb'
import { RecordData, GroupDate } from '../../interface/record'
import { transform, decodeBsonQuery, decodeField } from './util'
import { RecordQueryBll, RecordQuery, RecordAggregateByPatchSort, RecordGroup, Sort } from '../../interface/record-query'
import dbClient from '../../service/mongodb'
import { createLogger } from '../../service/logger'
const logger = createLogger({ label: 'mongodb-collection-engine' })

const pipelinePromise = promisify(pipeline)

enum PipelineKeyEnum {
  $match,
  $addFields,
  $group,
  $project,
  $sort,
  $limit,
  $skip
}

export class MongodbCollectionRecordQueryBllImpl implements RecordQueryBll<any, any> {
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

  async query({ filter, sort, spaceId, entityId, limit, skip = 0, options = {} }: RecordQuery<any, Sort>): Promise<AsyncIterable<RecordData>> {
    // filter transform to mongo query condition
    let conds = decodeBsonQuery(filter || {})
    conds = Object.assign({
      spaceId,
      entityId,
    }, conds)

    const addFields = {}
    const singleSort = {}

    Object.entries(sort || {}).map(([key, value]) => {
      if (value.falseField) {
        addFields[decodeField(key)] = {
          $ifNull: ['$' + decodeField(key), '$' + decodeField(value.falseField)]
        }
      }
      singleSort[decodeField(key)] = value.order || 1
    })

    if (Object.keys(addFields).length) {
      return this.aggregateByFalseField({ conds, sort: singleSort, addFields, limit, skip, options })
    }

    const cursor = this.collection.find(conds)

    // TODO: this is unsafe to use user's sort as mongo sort directly
    if (singleSort) cursor.sort(singleSort)
    if (skip) cursor.skip(skip)
    if (limit) cursor.limit(limit)

    // add time limit for query
    const maxTimeMs = options?.maxTimeMs || config.MONGODB_QUERY_OPTIONS?.maxTimeMs
    if (maxTimeMs) cursor.maxTimeMS(maxTimeMs)

    // add hint for query
    if (options?.hint) cursor.hint(options.hint)

    // add readPreference for query
    if (options?.readPreference) cursor.withReadPreference(options.readPreference)

    // cursor transform to RecordData
    return this.stream(cursor)
  }

  async aggregateByFalseField ({ conds, addFields, sort, limit, skip = 0, options = {} }: RecordAggregateByPatchSort<any, any>): Promise<AsyncIterable<RecordData>> {
    const pipeline: {[key in keyof typeof PipelineKeyEnum]?: any}[] = [{
      $match: conds
    }]
    const aggOption = {}

    if (addFields) {
      pipeline.push({
        $addFields: addFields
      })
    }
    if (sort) {
      pipeline.push({
        $sort: sort
      })
    }
    if (skip) {
      pipeline.push({
        $skip: skip
      })
    }
    if (limit) {
      pipeline.push({
        $limit: limit
      })
    }

    const maxTimeMs = options?.maxTimeMs || config.MONGODB_QUERY_OPTIONS?.maxTimeMs
    if (maxTimeMs) {
      Object.assign(aggOption, { maxTimeMS: maxTimeMs })
    }

    // add hint for query
    if (options?.hint) {
      Object.assign(aggOption, { hint: options.hint })
    }

    const cursor = this.collection.aggregate(pipeline, aggOption)

    // add readPreference for aggregate
    if (options?.readPreference) cursor.withReadPreference(options.readPreference)

    return this.stream(cursor)
  }

  private stream(cursor: FindCursor | AggregationCursor, transformDoc = true) {
    const result = new StreamTransform({
      readableObjectMode: true,
      objectMode: true,
      transform(doc: any, _, cb) {
        cb(null, transformDoc ? transform(doc) : doc)
      }
    })
    // cursor.pipe(transform)
    pipelinePromise(cursor.stream(), result).catch(err => {
      logger.error(err)
      result.emit('error', err)
    })
    return result
  }

  async count({ filter, spaceId, entityId, options }: RecordQuery<any, any>): Promise<number> {
    let conds = decodeBsonQuery(filter || {})
    conds = Object.assign({
      spaceId,
      entityId,
    }, conds)

    const result = await this.collection.countDocuments(conds, Object.assign({}, config.MONGODB_QUERY_OPTIONS, options))
    return result
  }

  async group ({ spaceId, entityId, filter, group = {}, sort, limit, options }: RecordGroup<any, any>): Promise<AsyncIterable<GroupDate>> {
    let conds = decodeBsonQuery(filter || {})
    conds = Object.assign({
      spaceId,
      entityId,
    }, conds)

    const { groupField, aggField, aggFunc = 'sum' } = group
    const pipeline: {[key in keyof typeof PipelineKeyEnum]?: any}[] = [{
      $match: conds
    }, {
      $group: {
        _id: groupField ? `$${decodeField(groupField)}` : null,
        [aggFunc]: { [`$${aggFunc}`]: aggField || 1 }
      }
    }, {
      $project: {
        _id: 0,
        [aggFunc]: 1,
        [groupField || 'id']: '$_id',
      },
    }]

    if (sort) {
      pipeline.push({
        $sort: sort
      })
    }

    if (limit) {
      pipeline.push({
        $limit: limit
      })
    }

    const aggOption = {}
    const maxTimeMs = options?.maxTimeMs || config.MONGODB_QUERY_OPTIONS?.maxTimeMs
    if (maxTimeMs) {
      Object.assign(aggOption, { maxTimeMS: maxTimeMs })
    }

    // add hint for aggregate
    if (options?.hint) {
      Object.assign(aggOption, { hint: options.hint })
    }

    const cursor = this.collection.aggregate(pipeline, aggOption)

    // add readPreference for aggregate
    if (options?.readPreference) cursor.withReadPreference(options.readPreference)

    return this.stream(cursor, false)
  }
}

export default new MongodbCollectionRecordQueryBllImpl()
