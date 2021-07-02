import * as Debug from 'debug'
import { Context, Middleware } from 'koa'
import * as KoaRouter from 'koa-router'

const debug = Debug('koa:decorator')

interface Controller {
}

interface ControllerConstructor extends Function {
  new (): Controller
}

interface MiddlewareFn {
  (ctx: Context): Promise<any>
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

interface RouteMeta {
  method: string
  path: string
  // method_path: {method: string, path: string}[]
  RequestDataDefine?: {
    [key: string]: {
      path: 'path' | 'query' | 'header' | 'body'
      name: string
    }
  }
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

export function controller(prefix: string = '/') {
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
      controllerMap.get(constructor).middlewares.push(middleware)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].middlewares.push(middleware)
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
      controllerMap.get(constructor).befores.push(beforeFunc)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].befores.push(beforeFunc)
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
      controllerMap.get(constructor).afters.push(afterFunc)
    } else {
      // method Decorator
      const constructor: ControllerConstructor = target.constructor
      if (!controllerMap.has(constructor)) controller('')(constructor)
      if (!controllerMap.get(constructor).methodMap[propertyName]) request('', '')(target, propertyName, descriptor)
      controllerMap.get(constructor).methodMap[propertyName].afters.push(afterFunc)
    }
  }
}


export function request(method = 'get', path = '/') {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const constructor = target.constructor
    debug('@request', method, path)
    if (!controllerMap.has(constructor)) controller('')(constructor)
    const methodMap = controllerMap.get(constructor).methodMap
    if (!methodMap[propertyName]) {
      methodMap[propertyName] = {
        method,
        path,
        RequestDataDefine: {},
        middlewares: [],
        befores: [],
        afters: [],
        requestStream: false,
        responseStream: false,
        propertyName,
      }
      return
    }
    methodMap[propertyName].method = method
    methodMap[propertyName].path = path
  }
}

export function get(path = '/') {
  return request('get', path)
}

export function post(path = '/') {
  return request('post', path)
}

export function getRouter(prefix = '/') {
  debug('getRouter')
  const router = new KoaRouter({ prefix })
  const controllers = Array.from(controllerMap.values())
  controllers.forEach(controllerMeta => {
    debug('getRouter prefix: ', controllerMeta.prefix)
    const controller = new controllerMeta.constructor()
    const controllerRouter = new KoaRouter()
    // middleware // maybe validator or authorzation check.

    const methods = Object.values(controllerMeta.methodMap)
    methods.forEach(methodMeta => {
      debug('getRouter methodMeta', methodMeta)
      debug('getRouter method: ', methodMeta.method, ' prefix: ', controllerMeta.prefix, 'path', methodMeta.path)
      const middlewares: Middleware[] = []

      // define data middleware
      middlewares.push(async (ctx, next) => {
        const data = Object.keys(methodMeta.RequestDataDefine).reduce((result, key) => {
          const defineKey = methodMeta.RequestDataDefine[key]
          let value
          if (defineKey.path === 'path') {
            value = ctx.params[defineKey.name]
          } else if (defineKey.path === 'query') {
            value = ctx.query[defineKey.name]
          } else if (defineKey.path === 'body') {
            value = ((ctx.request as any).body || {})[defineKey.name]
          }
          result[key] = value
          return result
        }, {})
        ctx.state = data
        return next()
      })

      // middleware
      middlewares.push(...methodMeta.middlewares)
      debug('methodMeta.middlewares', methodMeta.middlewares.length)

      // before after middlewares
      middlewares.push(async (ctx, next) => {
        for (const before of methodMeta.befores) {
          await before(ctx)
        }
        await next()
        for (const after of methodMeta.afters) {
          await after(ctx)
        }
      })

      // run process
      middlewares.push(async (ctx, next) => {
        const result = await controller[methodMeta.propertyName](ctx.state, ctx)
        ctx.body = result
        return next()
      })

      controllerRouter.register(methodMeta.path, [methodMeta.method], middlewares)
    })

    const middlewares: Middleware[] = [...controllerMeta.middlewares]

    // before after middlewares
    middlewares.push(async (ctx, next) => {
      for (const before of controllerMeta.befores) {
        await before(ctx)
      }
      await next()
      for (const after of controllerMeta.afters) {
        await after(ctx)
      }
    })

    middlewares.push(controllerRouter.routes())
    router.use(controllerMeta.prefix, ...middlewares)
    // router.use(controllerMeta.prefix, ...controllerMeta.middlewares, controllerRouter.routes())
  })
  return router
}
