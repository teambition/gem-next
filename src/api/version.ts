import * as fs from 'fs'
import * as path from 'path'
import { controller, get, before } from '../http-server/decorator'

const version = {
  name: 'unknown',
  version: 'unknown',
  startTime: new Date(),
  buildTime: new Date(),
  commit: 'unknown',
}

// generate version
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), {encoding: 'utf-8'}))
version.name = pkg.name
version.version = pkg.version

try {
  const buildInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../version.json'), {encoding: 'utf-8'}))
  version.buildTime = new Date(buildInfo.TIME)
  version.commit = buildInfo.COMMIT || 'unknown'
} catch (e) {
  console.warn('invaild version.json for /version: ' + e.message)
}

@controller('/version')
@before(async ctx => {
  ctx.skipLogger = true
})
export class VersionAPI {
  @get('/')
  async version() {
    return version
  }
}
