import 'mocha'
import { strict as assert } from 'assert'
import { Context } from 'koa'
import * as serverRatelimitBll from '../../src/bll/server-ratelimit'

describe('serverRatelimitBll', () => {
  it('serverRatelimitBll.checkEntityRateLimitMW()', async () => {
    const mw = serverRatelimitBll.checkEntityRateLimitMW({
      memoryStore: new serverRatelimitBll.MemoryStore({ resetIntervalMS: 20 }),
      waitInterval: 1
    })

    let i
    let throwErr = false
    try {
      for (i = 0; i < 20; i++) {
        await mw({
          request: {
            body: {
              spaceId: 'spaceId:000000000000000000000001',
              entityId: 'entityId:000000000000000000000001'
            },
          }
        } as Context)
      }
    } catch (err) {
      throwErr = true
    }

    assert.deepEqual(i >= 10, true)
    assert.deepEqual(throwErr, true)
  })

  it('serverRatelimitBll.checkEntityRateLimitMW() and retry success', async () => {
    const mw = serverRatelimitBll.checkEntityRateLimitMW({
      memoryStore: new serverRatelimitBll.MemoryStore({ resetIntervalMS: 20 }),
      waitInterval: 10
    })

    for (let i = 0; i < 10; i++) {
      await mw({
        request: {
          body: {
            spaceId: 'spaceId:000000000000000000000001',
            entityId: 'entityId:000000000000000000000001'
          },
        }
      } as Context)
    }
    await mw({
      request: {
        body: {
          spaceId: 'spaceId:000000000000000000000001',
          entityId: 'entityId:000000000000000000000001'
        },
      }
    } as Context)
  })

  it('serverRatelimitBll.checkEntityRateLimitMW() restore after resetInterval', async () => {
    const mw = serverRatelimitBll.checkEntityRateLimitMW({
      memoryStore: new serverRatelimitBll.MemoryStore({ resetIntervalMS: 10 }),
      waitInterval: 1
    })
    let i
    let throwErr = false
    try {
      for (i = 0; i < 10; i++) {
        await mw({
          request: {
            body: {
              spaceId: 'spaceId:000000000000000000000000',
              entityId: 'entityId:000000000000000000000000'
            },
          }
        } as Context)
      }
    } catch (err) {
      throwErr = true
    }

    assert.deepEqual(i >= 5, true)
    assert.deepEqual(throwErr, true)

    // wait 11ms
    await new Promise(resolve => setTimeout(resolve, 11))
    await mw({
      request: {
        body: {
          spaceId: 'spaceId:000000000000000000000000',
          entityId: 'entityId:000000000000000000000000'
        },
      }
    } as Context)
  })
})
