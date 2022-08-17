import IORedis from 'ioredis'
import * as config from 'config'

let redis
if (config.REDIS.CLUSTER) {
  redis = new IORedis.Cluster(config.REDIS.CLUSTER.HOSTS, config.REDIS.CLUSTER.CLUSTER_OPTIONS)
} else if (config.REDIS.HOST) {
  redis = new IORedis(config.REDIS.HOST, config.REDIS.CONNECTION_OPTIONS)
} else {
  redis = new IORedis(config.REDIS.CONNECTION_OPTIONS)
}

redis.on('error' ,(err) => {
  console.error('redis error', err)
  process.exit(1)
})

export default redis