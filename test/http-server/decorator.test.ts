import 'mocha'
import { strict as assert } from 'assert'
import * as decorator from '../../src/http-server/decorator'

describe('http-server decorator test suite', () => {
  afterEach(() => {
    decorator.clearAll()
  })

  it('decorator sequence', async () => {
    let sequence = 0
    @decorator.controller()
    @decorator.before(async () => {
      assert.equal(sequence++, 1)
    })
    @decorator.before(async () => {
      assert.equal(sequence++, 2)
    })
    @decorator.after(async () => {
      assert.equal(sequence++, 9)
    })
    @decorator.after(async () => {
      assert.equal(sequence++, 10)
    })
    @decorator.middleware(async (ctx, next) => {
      assert.equal(sequence++, 0)
      return next()
    })
  class FakeController {
      @decorator.get('getFunc')
      @decorator.before(async () => {
        assert.equal(sequence++, 4)
      })
      @decorator.before(async () => {
        assert.equal(sequence++, 5)
      })
      @decorator.after(async () => {
        assert.equal(sequence++, 7)
      })
      @decorator.after(async () => {
        assert.equal(sequence++, 8)
      })
      @decorator.middleware(async (ctx, next) => {
        assert.equal(sequence++, 3)
        return next()
      })
      @decorator.validator({
        properties: {
          k1: { type: 'string' },
        }
      })
      async getFunc(data) {
        assert.deepEqual(data, {
          k1: 'v1',
        })
        assert.equal(sequence++, 6)
      }
    }
    
    const router = decorator.getRouter()
    const ctx: any = {
      method: 'GET',
      path: '/getFunc',
      headers: {},
      query: {},
      request: { body: {
        k1: 'v1',
        k2: 'v2',
      } },
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const next: any = () => {}
    await router.routes()(ctx, next)
  })

  it('decorator validator fail', async () => {
    let sequence = 0
    @decorator.controller()
  class FakeController {
      @decorator.get('getFunc')
      @decorator.validator({
        type: 'object',
        required: ['requiredProperty'],
      })
      async getFunc() {
        assert.equal(sequence++, 6)
      }
    }
    
    const router = decorator.getRouter()
    const ctx: any = {
      method: 'GET',
      path: '/getFunc',
      headers: {},
      query: {},
      request: { body: {} },
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const next: any = () => {}
    await assert.rejects(router.routes()(ctx, next), {
      message: '/ must have required property \'requiredProperty\''
    })
  })
})
