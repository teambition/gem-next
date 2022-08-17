import * as config from 'config'
import * as moment from 'moment'
import { MiddlewareFn } from '@tng/koa-controller'
import * as createHttpError from 'http-errors'
import { createLogger } from '../service/logger'
import redis from '../service/redis'

const logger = createLogger({ label: 'ratelimit' })
export class MemoryStore {
  resetInterval: number

  constructor ({
    resetIntervalMS,
  }: {
    resetIntervalMS?: number
  } = {}) {
    this.init({ resetIntervalMS })
  }

  init ({
    resetIntervalMS = 60 * 1000, // 60 秒
  }: {
    resetIntervalMS?: number
  } = {}) {
    this.resetInterval = Math.min(resetIntervalMS, 5 * 60 * 1000) // 防止 redis 积压，限制周期最多 5分钟
  }

  async count ({
    baseDate = new Date(),
    prefixKey,
  }: {
    baseDate?: Date
    prefixKey: string,
  }) {
    const redisKey = prefixKey + moment(baseDate).format('YYYYMMDDHHMMss')
  
    const hKeys = []
    for (let diffIdx = 0; diffIdx < this.resetInterval; diffIdx++) {
      // 按 redis 存储位置计算, 每秒 一条记录
      const hKey = moment(baseDate).add(diffIdx * -1, 's').format('YYYYMMDDHHMMss')
      hKeys.push(`${redisKey}:${hKey}`)
    }
    // 一次获取最大匹配时间范围内的访问次数
    let total = await redis.mget(...hKeys)
    total = total.map(size => Number(size) || 0) 

    return total
  }

  async incr ({
    baseDate = new Date(),
    prefixKey,
    incr = 1,
  }: {
    baseDate?: Date
    prefixKey: string,
    incr?: number,
  }) {
    const redisKey = prefixKey + moment(baseDate).format('YYYYMMDDHHMMss')

    await redis.incrby(redisKey, incr)
    await redis.expire(redisKey, this.resetInterval)
  }
}

export const globalMemoryStore = new MemoryStore()

export function checkEntityRateLimitMW ({ memoryStore = globalMemoryStore, leftTryCount = 3, waitInterval = 500 }: { memoryStore?: MemoryStore, leftTryCount?: number, waitInterval?: number } = {}): MiddlewareFn {
  return async (ctx) => {
    const { spaceId, entityId } = ctx.request.body
    if (!spaceId || !entityId) return

    const prefixKey = spaceId + entityId
    const key = Object.keys(config.SERVER_RATELIMIT).find(key => new RegExp(key).test(prefixKey)) // 优先匹配到的规则优先级高
    const limitCount = config.SERVER_RATELIMIT?.[key]
    if (!limitCount) return

    const baseDate = new Date()
    const count = await memoryStore.count({ prefixKey, baseDate })
    logger.debug({ prefixKey, limitCount, count })

    // 正常访问 + 计数
    if (count <= limitCount) {
      await memoryStore.incr({ prefixKey, baseDate })
      return
    }

    // 等资源释放
    while (leftTryCount-- > 0) {
      await new Promise(resolve => setTimeout(() => resolve(1), waitInterval)) // 等 500ms 再次判断
      return checkEntityRateLimitMW({ leftTryCount })(ctx)
    }

    logger.warn({ message: 'ServerRequestLimit', prefixKey, limitCount, count })
    throw createHttpError(400, 'Service unavailable')
  }
}
