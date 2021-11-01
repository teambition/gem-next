import * as mongodb from 'mongodb'
import * as config from 'config'
import { createLogger } from './logger'

const logger = createLogger({ label: 'mongodb' })
const options: mongodb.MongoClientOptions = { }
Object.assign(options, config.MONGODB?.OPTIONS)
export const client = new mongodb.MongoClient(config.MONGODB?.URL, options)

client.on('error', (err) => {
  logger.error(err)
})

client.connect().then(() => {
  logger.info('mongodb connection success')
}, err => {
  logger.error(err, 'mongo connection error')
  process.exit(1)
})

export default client
