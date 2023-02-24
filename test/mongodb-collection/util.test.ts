import 'mocha'
// import _ from 'lodash'
import { strict as assert } from 'assert'
import * as mceUtil from '../../src/bll/mongodb-collection-engine/util'

describe('mongodb-collection-engine/util', () => {
  describe('decodeBsonValue', () => {
    function decodeBsonValueTest (type: string, value: any, expect: any) {
      it(`util.decodeBsonValue(${type})`, () => {
        const result = mceUtil.decodeBsonValue(value)
        if (expect instanceof Date) {
          assert.deepEqual(result.getTime(), expect.getTime())
        } else {
          assert.deepEqual(result, expect)
        }
      })
    }

    decodeBsonValueTest('null', null, null)
    decodeBsonValueTest('number', 1, 1)
    decodeBsonValueTest('float-number', 1.1, 1.1)
    decodeBsonValueTest('string', 'abc', 'abc')
    decodeBsonValueTest('boolean:true', true, true)
    decodeBsonValueTest('boolean:false', false, false)
    decodeBsonValueTest('date', {$date: '2015-01-23T04:56:17.893Z'}, new Date('2015-01-23T04:56:17.893Z'))
    decodeBsonValueTest('array:empty', [], [])
    decodeBsonValueTest('array:multiData', ['abc', true, 123], ['abc', true, 123])
  })

  describe('decodeBsonQuery', () => {
    function decodeBsonQueryTest (type: string, query: any, expect: any) {
      it(`util.decodeBsonQuery(${type})`, () => {
        const result = mceUtil.decodeBsonQuery(query)
        assert.deepEqual(result, expect)
      })
    }
    decodeBsonQueryTest('emptyObj', {}, {})
    decodeBsonQueryTest('{key:value}', {a: 'b'}, {$and: [{'cf:a': {$eq: 'b'}}]})
    decodeBsonQueryTest('{key:value, ...}', {a: 1, c: 'd', e: null}, {"$and":[
      {"cf:a":{"$eq":1}},
      {"cf:c":{"$eq":"d"}},
      {"cf:e":{"$eq":null}},
    ]})
    decodeBsonQueryTest('{key:{$ne: value}}', {a: {$ne: 'b'}}, {$and: [{'cf:a': {$ne: 'b'}}]})
    decodeBsonQueryTest('{key:{$gt: value}}', {a: {$gt: 'b'}}, {$and: [{'cf:a': {$gt: 'b'}}]})
    decodeBsonQueryTest('{key:{$lt: value}}', {a: {$lt: 'b'}}, {$and: [{'cf:a': {$lt: 'b'}}]})
    decodeBsonQueryTest('{key:{$gte: value}}', {a: {$gte: 'b'}}, {$and: [{'cf:a': {$gte: 'b'}}]})
    decodeBsonQueryTest('{key:{$lte: value}}', {a: {$lte: 'b'}}, {$and: [{'cf:a': {$lte: 'b'}}]})
    decodeBsonQueryTest('{key:{$in: [value]}}', {a: {$in: ['b']}}, {$and: [{'cf:a': {$in: ['b']}}]})
    decodeBsonQueryTest('{key:{$nin: [value]}}', {a: {$nin: ['b']}}, {$and: [{'cf:a': {$nin: ['b']}}]})
    decodeBsonQueryTest('{key:{$like: value}}', {a: {$like: 'b'}}, {$and: [{'cf:a': {$regex: 'b', '$options': 'i'}}]})
    decodeBsonQueryTest('{key:{$nlike: value}}', {a: {$nlike: 'b'}}, {$and: [{'cf:a': {$not: {$regex: 'b', '$options': 'i'}}}]})
    decodeBsonQueryTest('{$and: [{key:value}]}', {$and: [{a: 'b'}]}, {$and: [{$and: [{'cf:a': {$eq: 'b'}}]}]})
    decodeBsonQueryTest('{$or: [{key:value}]}', {$or: [{a: 'b'}]}, {$or: [{$and: [{'cf:a': {$eq: 'b'}}]}]})

    // id or date test should not use deep equal ...
    // decodeBsonQueryTest('{id:value}', {id: '123456789012345678901234'}, {$and: [{_id: {$eq: '123456789012345678901234'}}]})
  })

  describe('decodeBsonUpdate', () => {
    function decodeBsonUpdateTest (type: string, query: any, expect: any) {
      it(`util.decodeBsonUpdate(${type})`, () => {
        const result = mceUtil.decodeBsonUpdate(query)
        assert.deepEqual(result, expect)
      })
    }
    decodeBsonUpdateTest('{key:value}', {a: 'b'}, {$set: {'cf:a': 'b'}})
    decodeBsonUpdateTest('{key:[value]}', {a: ['b1','b2']}, {$set: {'cf:a': ['b1', 'b2']}})
    decodeBsonUpdateTest('{key:{$set: value}}', {a: {$set: 'b'}}, {$set: {'cf:a': 'b'}})
    decodeBsonUpdateTest('{key:{$addToSet: value}}', {a: {$addToSet: 'b'}}, {$addToSet: {'cf:a': {$each: ['b']}}})
    decodeBsonUpdateTest('{key:{$pull: value}}', {a: {$pull: 'b'}}, {$pullAll: {'cf:a': ['b']}})

  })
  describe('transform', () => {
    it('transform()', () => {
      const result = mceUtil.transform({
        id: 'abc',
        spaceId: 's1',
        entityId: 'e1',
        'cf:abc': 123,
        'cf:def': 'def',
      })
      assert.ok(result)
      assert.equal(result.id, 'abc')
      assert.equal(result.spaceId, 's1')
      assert.equal(result.entityId, 'e1')
      assert.deepEqual(result.cf, {
        abc: 123,
        def: 'def',
      })
    })
  })
})
