import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import * as config from 'config'
import { before, controller, get } from '../http-server/decorator'
import { generateOpenApiDoc } from '../http-server/openapi'
import * as createHttpError from 'http-errors'

let openapi: any

@controller('/doc')
@before(async (ctx) => {
  if (config.DISABLE_DOC) throw createHttpError(403)
})
@before(async (ctx) => {
  if (ctx.get('origin')) {
    ctx.set('Access-Control-Allow-Origin', '*')
  }
})
export class VersionAPI {
  @get('/')
  async doc() {
    // if (!openapi) {
    //   openapi = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../docs/api.yml'), {encoding: 'utf-8'}))
    // }
    // return openapi
    return generateOpenApiDoc()
  }
}
