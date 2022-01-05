import { Context, Middleware } from 'koa'
import * as KoaRouter from 'koa-router'
import * as Debug from 'debug'
import Ajv, { ValidateFunction, SchemaObject } from 'ajv'
import * as createHttpError from 'http-errors'

const ajv = new Ajv({
  coerceTypes: true,
  useDefaults: true,
})

ajv.addKeyword({
  keyword: 'from',
  validate: () => true,
})

const debug = Debug('koa:controller')

interface Controller {
}

interface ControllerConstructor extends Function {
  new (): Controller
}

export interface MiddlewareFn {
  (ctx: Context): Promise<void>
}

interface ControllerMeta {
  prefix: string
  constructor: ControllerConstructor
  middlewares: Middleware[]
  befores: MiddlewareFn[]
  afters: MiddlewareFn[]
  methodMap: Record<string, RouteMeta>
}

interface RouteMeta {
  verb: string
  path: string
  params?: Record<string, string[]>
  middlewares: Middleware[]
  befores: MiddlewareFn[]
  afters: MiddlewareFn[]
  validator: ValidateFunction<any>
  requestStream?: boolean
  responseStream?: boolean
  propertyName: string
}

export const controllerMap = new Map<ControllerConstructor, ControllerMeta>()
// const controllers: ControllerMeta[] = []

export function controller(prefix = '/') {
  return (constructor: ControllerConstructor) => {
    debug('@controller', prefix)
    if (!controllerMap.has(constructor)) {
      controllerMap.set(constructor, {
          prefix,
          constructor,
          middlewares: [],
          befores: [],
          afters: [],
          methodMap: {},
      })
      return
    }
    controllerMap.get(constructor).prefix = prefix
  }
}

export function middleware(middleware: Middleware) {
  return (target: any, propertyName?: string, descriptor?: PropertyDescriptor) => {
    debug('@middleware')
    if (typeof propertyName === 'undefined') {
      // class Decorator
      const constructor: ControllerConstructor = target
      if (!controllerMap.has(constructor)) controller('')(constructor)
      controllerMap.get(constructor).middlewares.unshift(middleware)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].middlewares.unshift(middleware)
    }
  }
}

export function validator(jsonSchema: SchemaObject) {
  // generator validator function
  return (target: any, propertyName: string, descriptor?: PropertyDescriptor) => {
    debug('@validator')
    const constructor: ControllerConstructor = target.constructor
    if (!controllerMap.has(constructor)) controller('')(constructor)
    if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
    controllerMap.get(constructor).methodMap[propertyName].validator = ajv.compile(jsonSchema)
    if (jsonSchema.properties) {
      const params = Object.keys(jsonSchema.properties).reduce<Record<string, string[]>>((result, field) => {
        let from = jsonSchema.properties[field].from || ['params', 'body', 'query']
        if (!Array.isArray(from)) from = [from]
        return Object.assign(result, {[field]: from})
      }, {})
      controllerMap.get(constructor).methodMap[propertyName].params = params
    }
  }
}

export function before(beforeFunc: MiddlewareFn) {
  return (target: any, propertyName?: string, descriptor?: PropertyDescriptor) => {
    debug('@before')
    if (typeof propertyName === 'undefined') {
      // class Decorator
      const constructor: ControllerConstructor = target
      if (!controllerMap.has(constructor)) controller('')(constructor)
      controllerMap.get(constructor).befores.unshift(beforeFunc)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].befores.unshift(beforeFunc)
    }
  }
}

export function after(afterFunc: MiddlewareFn) {
  return (target: any, propertyName?: string, descriptor?: PropertyDescriptor) => {
    debug('@after')
    if (typeof propertyName === 'undefined') {
      // class Decorator
      const constructor: ControllerConstructor = target
      if (!controllerMap.has(constructor)) controller('')(constructor)
      controllerMap.get(constructor).afters.unshift(afterFunc)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].afters.unshift(afterFunc)
    }
  }
}

export function request(verb = 'get', path = '/') {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    debug('@request', verb, path)
    if (!controllerMap.has(constructor)) controller('')(constructor)
    const methodMap = controllerMap.get(constructor).methodMap
    if (!methodMap[propertyName]) {
      methodMap[propertyName] = {
        verb,
        path,
        params: {},
        middlewares: [],
        validator: null,
        befores: [],
        afters: [],
        requestStream: false,
        responseStream: false,
        propertyName,
      }
      return
    }
    methodMap[propertyName].verb = verb
    methodMap[propertyName].path = path
  }
}

export function get(path = '/') {
  return request('get', path)
}

export function post(path = '/') {
  return request('post', path)
}

export function getRouter(prefix = '') {
  debug('getRouter')
  const router = new KoaRouter({ prefix })
  const controllers = Array.from(controllerMap.values())
  controllers.forEach(controllerMeta => {
    debug('getRouter controller prefix:', controllerMeta.prefix)
    if (!controllerMeta.prefix) return
    const controller = new controllerMeta.constructor()
    const controllerRouter = new KoaRouter()
    // middleware // maybe validator or authorzation check.

    const methods = Object.values(controllerMeta.methodMap)
    methods.forEach(methodMeta => {
      debug('getRouter method', methodMeta)
      // debug('getRouter method verb:', methodMeta.verb, ' prefix:', controllerMeta.prefix, 'path:', methodMeta.path)
      if (!methodMeta.path) return
      const middlewares: Middleware[] = []

      // define data middleware
      middlewares.push(async (ctx, next) => {
        debug('running define state data')
        ctx.state = Object.assign({}, ctx.query, ctx.params, ctx.request.body)
        if (methodMeta.params) {
          const all = {
            params: ctx.params,
            query: ctx.query,
            body: ctx.request.body,
            header: ctx.headers
          }
          ctx.state = Object.keys(methodMeta.params).reduce((result, key) => {
            let value: any = undefined
            methodMeta.params[key].some(fromPath => {
              const fromKey = fromPath.split('.')[1] || key
              value = all[fromPath] && all[fromPath][fromKey] || undefined
              return value !== undefined
            })
            return Object.assign(result, {[key]: value})
          }, {})
        }
        return next()
      })

      // validator
      middlewares.push(async (ctx, next) => {
        if (methodMeta.validator && !methodMeta.validator(ctx.state)) {
          const error = methodMeta.validator.errors[0]
          error.message = (error.instancePath || '/') + ' ' + error.message
          throw createHttpError(400, error.message, { ...error })
        }
        return next()
      })

      // middleware
      middlewares.push(...methodMeta.middlewares)
      debug('methodMeta.middlewares', methodMeta.middlewares.length)

      // before after middlewares
      middlewares.push(async (ctx, next) => {
        for (const before of methodMeta.befores) {
          debug('running method before')
          await before(ctx)
        }
        debug('running method function')
        await next()
        for (const after of methodMeta.afters) {
          debug('running method after')
          await after(ctx)
        }
      })

      // run process
      middlewares.push(async (ctx) => {
        ctx.body = await controller[methodMeta.propertyName](ctx.state, ctx)
      })

      controllerRouter.register(methodMeta.path, [methodMeta.verb], middlewares)
    })

    const middlewares: Middleware[] = [...controllerMeta.middlewares]

    // before after middlewares
    middlewares.push(async (ctx, next) => {
      for (const before of controllerMeta.befores) {
        debug('running controller before')
        await before(ctx)
      }
      debug('running controller')
      await next()
      for (const after of controllerMeta.afters) {
        debug('running controller after')
        await after(ctx)
      }
    })

    middlewares.push(controllerRouter.routes())
    router.use(controllerMeta.prefix, ...middlewares)
  })
  return router
}

export function clearAll() {
  controllerMap.clear()  
}
