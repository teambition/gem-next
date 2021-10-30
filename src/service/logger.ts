import pino from 'pino'
import { merge } from 'lodash'
import * as config from 'config'

export function createLogger({ label = 'app' }: { label?: string } = {}) {
  return pino(merge({
    base: { label },
    messageKey: 'message',
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: { target: 'pino-pretty', options: {
      messageFormat: '{label} - {message}',
      messageKey: 'message',
      translateTime: 'HH:MM:ss.l',
      ignore: 'label',
    } },
  }, config.LOGGERS && config.LOGGERS[label]))
}

export default createLogger
