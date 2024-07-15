import { AsyncLocalStorage } from 'async_hooks'

export const asyncLocalStorage = new AsyncLocalStorage<Record<string | symbol, any>>()
export const als = asyncLocalStorage
export default als
