import * as config from 'config'
import app from './http-server'
import { createLogger } from './service/logger'
const logger = createLogger({ label: 'app' })

app.listen(config.PORT, () => {
  logger.info('http serving ...')
})

process.on('unhandledRejection', (err) => {
  logger.error(err, 'unhandledRejection')
})
