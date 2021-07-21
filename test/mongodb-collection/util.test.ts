import 'mocha'
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
    decodeBsonQueryTest('{key:value, ...}', {a: 'b', c: 'd', e: null}, {"$and":[{"cf:a":{"$eq":"b"}},{"cf:c":{"$eq":"d"}},{"cf:e":{"$eq":null}}]})
  })

})
