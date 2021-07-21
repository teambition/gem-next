import 'mocha'
import { strict as assert } from 'assert'
import * as mceUtil from '../../src/bll/mongodb-collection-engine/util'

describe('mongodb-collection/util', () => {
  describe('mceUtil.decodeBsonValue', () => {
    function decodeBsonValueTest (type: string, value: any, expect: any) {
      it(`mceUtil.decodeBsonValue(${type}): ${JSON.stringify(value)}`, () => {
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
    decodeBsonValueTest('number', 1.1, 1.1)
    decodeBsonValueTest('string', 'abc', 'abc')
    decodeBsonValueTest('boolean', true, true)
    decodeBsonValueTest('boolean', false, false)
    decodeBsonValueTest('date', {$date: '2015-01-23T04:56:17.893Z'}, new Date('2015-01-23T04:56:17.893Z'))
    decodeBsonValueTest('array', [], [])
    decodeBsonValueTest('array', ['abc', true, 123], ['abc', true, 123])
  })
})
