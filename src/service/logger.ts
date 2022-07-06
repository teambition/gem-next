import pino from 'pino'
import { merge } from 'lodash'
import * as config from 'config'

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
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
      target: 'pino-pretty',
      options: {
        messageFormat: '{label} - {message}',
        messageKey: 'message',
        translateTime: 'HH:MM:ss.l',
        ignore: 'label',
      },
    },
  }, config.LOGGERS?.base, config.LOGGERS?.[label], options))
}

export default createLogger
