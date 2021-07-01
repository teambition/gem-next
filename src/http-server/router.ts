import recordAPI from '../api/record'
import * as Router from 'koa-router'
export const router = new Router()
router.post('api/record/query', recordAPI.main)