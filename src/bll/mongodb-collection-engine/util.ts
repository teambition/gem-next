import { strict as assert } from 'assert'
import { ObjectId } from 'mongodb'
import { RecordData } from '../../interface/record'

const INTERNAL_KEYS = ['id', 'createTime', 'updateTime']
const QUERY_OPS = [
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$like',
]
const MANIPULDATE_OPS = [
  '$addToSet', // { $addToSet: { field: { $each: [] } } }
  '$pull', // { $pullAll: {field: [] } }
  '$set',
  '$unset',
  '$inc',
]

interface TransformOptions {
  encodeBson?: boolean
}

export function transform(doc: any, options: TransformOptions = {}): RecordData {
  return {
    id: String(doc._id),
    spaceId: String(doc.spaceId),
    entityId: String(doc.entityId),
    labels: doc.labels || [],
    createTime: new Date(doc.createTime),
    updateTime: new Date(doc.updateTime),
    cf: Object.keys(doc)
      .filter(key => /^cf:/.test(key))
      .reduce<{[x: string]: any}>((result, key) => {
        const cfKey = key.slice(3) // omit 'cf:'
        let value = doc[key]
        if (options.encodeBson) value = encodeBsonValue(value)
        Object.assign(result, {[cfKey]: value})
        return result
      }, {})
  }
}

export function decodeBsonValue(value: any): any {
  // string: 'abc'
  // number: 12 4.5
  // boolean: true, false
  // date: { $date: '2015-01-23T04:56:17.893Z' }
  // array: ['abc', 12, 4.5, false, { $date: '2015-01-23T04:56:17.893Z' }]

  if (value === undefined || value === null) return value
  if (Array.isArray(value)) return value.map(v => decodeBsonValue(v))

  const tov = typeof value // type of value
  if (['string', 'number', 'boolean'].includes(tov)) return value

  const keys = Object.keys(value)
  const objKey = Object.keys(value)[0]
  assert.equal(keys.length, 1)
  // assert.equal(keys[0][0], '$')
  // const dataType = keys[0].slice(1)
  if (objKey === '$date') {
    value = value[objKey]
    assert.ok(isFinite(new Date(value).getTime()))
    return new Date(value)
  }
  throw new Error(`invalid action ${objKey}`)
}

export function encodeBsonValue(value: any): any {
  if (value === undefined || value === null) return value
  if (Array.isArray(value)) return value.map(v => encodeBsonValue(v))

  const tov = typeof value
  if (['string', 'number', 'boolean'].includes(tov)) return value
  if (value instanceof Date) {
    return { $date: value.toISOString() }
  }
  throw new Error(`invalid value to encode: ${value}`)
}

export function decodeField(key: string) {
  if (key === 'id') return '_id'
  if (INTERNAL_KEYS.includes(key)) return key
  return 'cf:' + key
}

// export function decodeObjectIdValue(value: string) {
//   return new ObjectId(value)
// }

export function decodeBsonQuery(query: Record<string, any> = {}): any {
  // field: {$gt: {$date: '2020-01-1'}}
  // field: 1
  // field: {$eq: 1}
  // field: [1]
  // field: {$date: '2021-12-03'}
  // field: [{$date: '2021-12-03'}]
  const result: any = { }
  for (const key in query) {
    let value = query[key]
    if (key === '$and' || key === '$or') {
      assert.ok(Array.isArray(value))
      const arrays = query[key].map(child => decodeBsonQuery(child))
      result[key] = result[key] || []
      result[key].push(...arrays)
      continue
    }

    let op = '$eq'
    if (typeof value === 'object' && !Array.isArray(value)) {
      const objKey = value && Object.keys(value)[0]
      if (QUERY_OPS.includes(objKey)) {
        op = objKey
        value = value[objKey]
      }
    }
    value = decodeBsonValue(value)
    // TODO: assert op match value type ($in/$nin should follow array)

    result.$and = result.$and || []
    const field = decodeField(key)

    // special field value format for _id
    if (field === '_id') value = new ObjectId(value)
    if (op === '$like') op = '$regex'
    result.$and.push({ [field]: { [op]: value } })
  }

  return result
}

export function decodeBsonUpdate(cond: any): any {
  // key: {$unset: 1}
  // key: 1
  // key: {$date: '2021-12-03'}
  // key: {$addSet: 'abc'}
  // key: ['abc']
  // key: {$set: ['abc']}
  // const result = 
  const result: any = {}

  for (const key in cond) {
    let value = cond[key]
    let op = '$set'

    if (typeof value === 'object' && !Array.isArray(value)) {
      const objKey = Object.keys(value)[0]
      if (MANIPULDATE_OPS.includes(objKey)) {
        op = objKey
        value = value[objKey]
      }
      value = decodeBsonValue(value)
    }

    // addToSet and pull need a value of array
    if ((op === '$addToSet' || op === '$pull') && !Array.isArray(value)) {
      value = [value]
    }

    // mongodb need pullAll insteadof pull
    if (op === '$pull') {
      op = '$pullAll'
    }

    const one: any = result[op] = result[op] || {}
    const field = 'cf:' + key

    // addToSet need '$each' as modifier
    if (op === '$addToSet') {
      one[field] = { $each: value }
    } else {
      one[field] = value
    }
  }
  return result
}
