import recordAPI from '../api/record'
import * as Router from 'koa-router'

export const router = new Router()
router.post('/api/record/query', recordAPI.query.bind(recordAPI))
router.post('/api/record/create', recordAPI.create.bind(recordAPI))
export default router
