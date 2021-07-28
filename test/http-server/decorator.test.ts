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
      @decorator.params({
        k1: {path: 'path', name: 'k1'},
        k2: {path: 'body', name: 'k2'},
        k3: {path: 'query', name: 'k3'},
        k4: 'k4',
      })
      @decorator.validator({})
      async getFunc() {
        assert.equal(sequence++, 6)
      }
    }
    
    const router = decorator.getRouter()
    const ctx: any = {
      method: 'GET',
      path: '/getFunc',
      query: {},
      request: { body: {} },
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
