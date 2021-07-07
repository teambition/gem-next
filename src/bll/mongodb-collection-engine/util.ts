import { strict as assert } from 'assert'
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

export function transform(doc: any): RecordData {
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
        Object.assign(result, {[cfKey]: doc[key]})
        return result
      }, {})
  }
}

export function decodeBsonValue(value: any): any {
  if (value === undefined || value === null) return value
  if (Array.isArray(value)) return value.map(v => decodeBsonValue(v))

  const tov = typeof value // type of value
  if (['string', 'number', 'boolean'].includes(tov)) return value
  const keys = Object.keys(value)
  assert.equal(keys.length, 1)
  assert.equal(keys[0][0], '$')
  const dataType = keys[0].slice(1)
  if (dataType === 'date') {
    assert.ok(isFinite(new Date(value).getTime()))
    return new Date(value)
  }
  throw new Error(`invalid action $${dataType}`)
}

export function decodeBsonQuery(query: any): any {
  const result: any = { $and: [] }
  for (let key in query) {
    let value = query[key]
    if (key === '$and' || key === '$or') {
      assert.ok(Array.isArray(value))
      result[key] = query[key].map(child => decodeBsonQuery(child))
      continue
    }

    let op = '$eq'
    if (typeof value === 'object' && !Array.isArray(value)) {
      op = Object.keys(value)[0]
      assert.ok(QUERY_OPS.includes(op))
      // TODO: maybe value directly
      value = value[op]
      if (Array.isArray(value)) {
        value = value.map(decodeBsonValue(value))
      } else {
        value = decodeBsonValue(value)
      }
      // TODO: assert op match value type ($in/$nin should follow array)
    } else {
      value = decodeBsonValue(value)
    }
    result.$and.push({ [key]: { [op]: value } })
    // value.$eq
  }
  return result
  // key: {$gt: {$date: '2020-01-1'}}
  // key: 1
  // key: {$eq: 1}
  // key: [1]
  // key: {$date: '2021-12-03'}
  // key: [{$date: '2021-12-03'}]
}

export function decodeBsonUpdate(cond: any): any {

  // key: {$gt: {$date: '2020-01-1'}}
  // key: {$unset: 1}
  // key: 1
  // key: {$date: '2021-12-03'}
  // key: {$addSet: 'abc'}
  // key: {$addSetEach: ['abc']}
  // key: ['abc']
  // key: {$set: ['abc']}

  // const result = 
  let key
  let value = cond[key]
  let op = 'set'
  if (Array.isArray(value)) {
    value = decodeBsonValue(value)
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    assert.equal(keys.length, 1)
    const key2 = keys[0]
    const val2 = value[key2]
    assert.equal(key2[0], '$')
    let op = key2.slice(1)
    switch (op) {
      case 'set':
      case 'unset':
      case 'addSet':
      case 'addSetEach':
      default:
        op = 'set'
    }
  }
}
