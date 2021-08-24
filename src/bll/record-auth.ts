import * as Debug from 'debug'
import * as config from 'config'
import * as jwt from 'jsonwebtoken'
import { strict as assert } from 'assert'

const debug = Debug('recordAuthBll')

export class RecordAuthBll {
  sign({ spaceId, entityId, expireSeconds = 300 }) {
    return jwt.sign({
      spaceId,
      entityId,
    }, config.JWTKEYS[0], {
      expiresIn: expireSeconds
    })
  }

  verify({ spaceId, entityId, token }) {
    debug('verify', spaceId, entityId, token)
    try {
      let claim: {[x: string]: any}
      for (const key of config.JWTKEYS || []) {
        claim = jwt.verify(token, key) as {[x: string]: any}
      }
      debug('verify claim', claim)
      assert.ok(claim.spaceId && claim.entityId)
      const spaceIdRegExps = this.generateRegExp(claim.spaceId)
      const entityIdRegExps = this.generateRegExp(claim.entityId)
      assert.ok(spaceIdRegExps.some(regex => regex.test(spaceId)))
      assert.ok(entityIdRegExps.some(regex => regex.test(entityId)))
    } catch (e) {
      const error = new Error('invalid jwt token')
      Object.assign(error, { status: 403, origin: e.message })
      throw error
    }
  }

  generateRegExp(m: string): RegExp[] {
    return m.split(',')
      .filter(v => v)
      .map(m => new RegExp('^' + m.replace(/\*/, '[\\w:-_]*').trim() + '$'))
  }
}

export default new RecordAuthBll()
