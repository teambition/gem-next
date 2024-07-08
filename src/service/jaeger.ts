import * as fs from 'fs'
import * as path from 'path'
import * as config from 'config'
import { initTracer, ZipkinB3TextMapCodec } from 'jaeger-client'

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../', 'package.json'), { encoding: 'utf-8' }))

export const tracer = initTracer({
  serviceName: pkg.name,
  sampler: {
    type: 'probabilistic', // 百分比
    param: config.JAEGER?.RATE || 0.01,
  },
  reporter: {
    collectorEndpoint: config.JAEGER?.ENDPOINT,
  },
}, {
  tags: {
    version: pkg.version
  },
  logger: console,
})

const zipkinCodec = new ZipkinB3TextMapCodec({ urlEncoding: true })
tracer.registerInjector('ZIPKIN_HTTP_HEADERS', zipkinCodec)
tracer.registerExtractor('ZIPKIN_HTTP_HEADERS', zipkinCodec)

export default tracer
