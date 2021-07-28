import { Context, Middleware } from 'koa'
import * as KoaRouter from 'koa-router'
import * as Debug from 'debug'

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
  // methods: RouteMeta[]
  methodMap: Record<string, RouteMeta>
}

interface ParamDefinition {
  path: 'path' | 'query' | 'header' | 'body' | string
  name: string
}

interface RouteParamsInput {
  [key: string]: string | Partial<ParamDefinition>
}

interface RouteParams {
  [key: string]: ParamDefinition
}

interface RouteMeta {
  verb: string
  path: string
  // method_path: {method: string, path: string}[]
  params?: RouteParams
  middlewares: Middleware[]
  befores: MiddlewareFn[]
  afters: MiddlewareFn[]
  requestStream?: boolean
  responseStream?: boolean
  propertyName: string
  // method: (req: any) => Promise<any>
}

const controllerMap = new Map<ControllerConstructor, ControllerMeta>()
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

export function params(data: RouteParamsInput) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    debug('@params')
    const constructor: ControllerConstructor = target.constructor
    if (!controllerMap.has(constructor)) controller('')(constructor)
    if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)

    controllerMap.get(constructor).methodMap[propertyName].params = Object.keys(data).reduce<RouteParams>((r, k) => {
      if (typeof data[k] === 'string') {
        r[k] = { path: String(data[k]), name: k }
      } else {
        r[k] = {
          name: (data[k] as ParamDefinition).name || k,
          path: (data[k] as ParamDefinition).path || 'body',
        }
      }
      return r
    }, {})
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

export function validator(jsonSchema) {
  // TODO: generator validator
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

function getParamsValue(ctx: Context, paramDefinition: ParamDefinition) {
  const paramPath = paramDefinition.path || 'body'
  const name = paramDefinition.name
  switch (paramPath) {
    case 'path': return ctx.params[name]
    case 'query': return ctx.query[name]
    default: // body
      return (ctx.request.body || {})[name] 
  }
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
        ctx.state = Object.assign({}, ctx.params, ctx.query, ctx.request.body)
        const data = Object.keys(methodMeta.params).reduce((result, key) => {
          const paramDefinition = methodMeta.params[key]
          paramDefinition.name = paramDefinition.name || key
          result[key] = getParamsValue(ctx, paramDefinition)
          return result
        }, {})
        ctx.state = Object.assign(ctx.state, data)
        return next()
      })

      // validator
      // TODO: add validator

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
