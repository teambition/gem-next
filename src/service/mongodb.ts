import * as mongodb from 'mongodb'
import * as config from 'config'

const options: mongodb.MongoClientOptions = { }
Object.assign(options, config.MONGODB?.OPTIONS)
export const client = new mongodb.MongoClient(config.MONGODB?.URL, options)
client.connect().then(() => {
  console.log('mongodb connection success')
}, err => {
  console.error('fatal mongo connection error', err)
  process.exit(1)
})
client.on('error', err => {
  console.error(Object.assign(err, {
    class: 'mongodb'
  }))
})

export default client
