import pino from 'pino'
import { merge } from 'lodash'
import * as config from 'config'
import { als } from './async-storage'

// https://github.com/pinojs/pino/issues/78
// pino官方不喜欢使用环境变量控制日志等级
// 参考debug代码，使用 `LOGGER_DEBUG=xxx` 的方式支持环境变量增加日志的方式
// 这里支持各个等级的日志等级控制，主要用于DEBUG和trace控制。
// 在不改变配置文件的情况下，通过环境变量控制就可以做到
const levels = ['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE']
const envLabelLevelMap: Record<string, string> = {}
levels.forEach(level => {
  (process.env['LOGGER_' + level] || '').split(',').filter(Boolean).forEach(label => {
    envLabelLevelMap[label] = level
  })
})

export function createLogger({
  label = 'app',
  options,
  // destination = 1,
}: {
  label?: string
  options?: pino.LoggerOptions
  // destination?: string | number | pino.DestinationObjectOptions | pino.DestinationStream | NodeJS.WritableStream
} = {}) {
  return pino(merge({
    base: { label },
    messageKey: 'message',
    mixin () {
      return { traceId: als.getStore()?.traceId }
    },
    formatters: {
      // 由于 pino 会把 Error Object 全部序列化到 err 这个字段
      // 代码中给 Error 对象添加的额外属性 也全部到 err 这个字段里了
      // 这样日志格式字段中如果需要统计一个类别的日志
      // 只能 label 字段 和 mixin() 方法加入字段，没有其他自由添加字段的方法
      // 所以 弃用 err 字段，直接将 Error 对象序列化之后作为日志对象
      // 已知可能造成的问题:
      //    logger.error(new Error('a'), 'b')
      // 这样会产生2个一摸一样的 message
      //    {"level":50,
      //     "time":"2022-04-07T17:03:52.534Z",
      //     "label":"app",
      //     "type":"Error",
      //     "message":"a",
      //     "stack":"...",
      //     "message":"b"} // 这里多了一个message
      log (obj) {
        if (obj?.err) {
          const { traceId } = obj
          return Object.assign(pino.stdSerializers.err(obj.err), { traceId })
        }
        return obj
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: null,
  }, config.LOGGERS?.base, options, config.LOGGERS?.[label], { level: envLabelLevelMap[label] }))
}

export default createLogger
