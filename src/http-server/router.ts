// import recordAPI from '../api/record'
import * as path from 'path'
import * as glob from 'glob'
import { getRouter } from './decorator'

glob.sync('api/**/*.[jt]s', {
  cwd: path.resolve(__dirname, '../'),
}).forEach(file => {
  require('../' + file)
})

export const router = getRouter('/api')
export default router
