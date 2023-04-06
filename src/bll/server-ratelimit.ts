import * as config from 'config'
import { MiddlewareFn } from '@tng/koa-controller'
import * as createHttpError from 'http-errors'
import { createLogger } from '../service/logger'

const logger = createLogger({ label: 'ratelimit' })
export class MemoryStore {
  hits: Record<string, number> = {}
  resetIntervalMS: number
  resetTime: number

  resetAll () {
    this.hits = {}
    this.resetTime = Date.now() + this.resetIntervalMS
  }

  constructor ({
    resetIntervalMS,
  }: {
    resetIntervalMS?: number
  } = {}) {
    this.init({ resetIntervalMS })
  }

  init ({
    resetIntervalMS = config.SERVER_RATELIMIT_RESET_INTERVAL_MS || 60 * 1000,
  }: {
    resetIntervalMS?: number
  } = {}) {
    this.resetIntervalMS = resetIntervalMS
    this.resetAll()
  }

  count ({
    key,
  }) {
    if (Date.now() > this.resetTime) this.resetAll()
    return this.hits[key] || 0
  }

  incr ({
    key,
    incr = 1,
  }: {
    key: string,
    incr?: number,
  }) {
    this.hits[key] = this.hits[key] + incr || incr

    return {
      count: this.hits[key],
    }
  }
}

export const globalMemoryStore = new MemoryStore()

export function checkEntityRateLimitMW ({ memoryStore = globalMemoryStore, leftTryCount = 3, waitInterval = config.SERVER_RATELIMIT_RETRY_INTERVAL_MS || 200 }: { memoryStore?: MemoryStore, leftTryCount?: number, waitInterval?: number } = {}): MiddlewareFn {
  return async (ctx) => {
    if (!config.SERVER_RATELIMIT) return

    const { spaceId, entityId } = ctx.request.body
    if (!spaceId || !entityId) return

    let prefixKey = spaceId + '-' + entityId
    // implement controller
    if (ctx.routerName) {
      prefixKey = prefixKey + '-' + ctx.routerName
    }

    // 先匹配到的规则优先级高
    const key = Object.keys(config.SERVER_RATELIMIT).find(key => new RegExp(key).test(prefixKey))
    const limitCount = config.SERVER_RATELIMIT?.[key]
    if (!limitCount) return

    const count = memoryStore.count({ key: prefixKey })
    logger.debug({ prefixKey, limitCount, count })

    // 正常访问 + 计数
    if (count < limitCount) {
      memoryStore.incr({ key: prefixKey })
      return
    }

    // 等资源释放
    while (leftTryCount-- > 0) {
      await new Promise(resolve => setTimeout(() => resolve(1), waitInterval)) // 等 100ms 再次判断
      return checkEntityRateLimitMW({ leftTryCount })(ctx)
    }

    logger.warn({ message: 'ServerRequestLimit', spaceId, entityId, prefixKey, limitCount, count })
    throw createHttpError(400, 'Service unavailable')
  }
}
