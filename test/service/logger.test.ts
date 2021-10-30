import 'mocha'
import { strict as assert } from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import { createLogger } from '../../src/service/logger'

const logfilepath = path.resolve(__dirname, 'tmp.log')

describe('createLogger', () => {
  afterEach(async () => {
    try {
      fs.rmSync(logfilepath)
    } catch (err) {
      // ignore error
    }
  })

  it('createLogger()', async () => {
    const logger = createLogger({
      label: 'this is label',
      options: {
        transport: {
          target: 'pino/file',
          options: { destination: path.resolve(__dirname, 'tmp.log') },
        }
      }
    })
    const loggerTime = Date.now()
    logger.info({key: 'value'}, 'this is message')
    const waitTime = 300
    await new Promise(resolve => setTimeout(() => resolve(1), waitTime))
    const resultString = fs.readFileSync(logfilepath, { encoding: 'utf-8' })
    const result = JSON.parse(resultString)

    assert.ok(new Date(result.time).getTime() - loggerTime < 10, 'log time difference should less than 10ms')
    assert.equal(result.message, 'this is message')
    assert.equal(result.level, 30)
    assert.equal(result.label, 'this is label')
    assert.equal(result.key, 'value')
  })
})
