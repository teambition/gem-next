import { Context, Middleware } from 'koa'
import * as KoaRouter from 'koa-router'
interface Controller {
}

interface ControllerConstructor extends Function {
  new (): Controller
}

interface ControllerMeta {
  path: string
  constructor: ControllerConstructor
  middlewares: Middleware[]
  // methods: RouteMeta[]
  methodMap: Record<string, RouteMeta>
}

interface RouteMeta {
  method: string
  path: string
  RequestDataDefine?: {
    [key: string]: {
      path: 'path' | 'query' | 'header' | 'body'
      name: string
    }
  }
  middlewares: Middleware[]
  requestStream?: boolean
  responseStream?: boolean
  propertyName: string
  // method: (req: any) => Promise<any>
}

const controllerMap = new Map<ControllerConstructor, ControllerMeta>()
// const controllers: ControllerMeta[] = []

export function httpController(path: string = '/') {
  return (constructor: ControllerConstructor) => {
    const meta: ControllerMeta = {
      path,
      constructor,
      middlewares: [],
      methodMap: {},
    }
    controllerMap.set(constructor, meta)
    // controllers.push(meta)
  }
}

export function httpMiddleware(middleware: Middleware) {
  return (constructor: ControllerConstructor, propertyName: string, descriptor: PropertyDescriptor) => {
    if (!controllerMap.has(constructor)) throw new Error(`Controller '${constructor.name} hasnt been define yet. add @controller() decorator`)
    const controllerMeta = controllerMap.get(constructor)
    if (typeof propertyName === 'undefined') {
      // class Decorator
      controllerMeta.middlewares.push(middleware)
    } else {
      // method Decorator
      const methodMeta = controllerMeta.methodMap[propertyName]
      if (!methodMeta) throw new Error(`Controller '${constructor.name} hasnt method define yet. add @request/@get/@post() decorator`)
      methodMeta.middlewares.push(middleware)
    }
  }
}

export function httpRequest(method = 'get', path = '/') {
  return (constructor: ControllerConstructor, propertyName: string, descriptor: PropertyDescriptor) => {
    if (!controllerMap.has(constructor)) throw new Error(`Controller '${constructor.name} hasnt been define yet. add @controller() decorator`)
    const controllerMeta = controllerMap.get(constructor)
    controllerMeta.methodMap[propertyName] = {
      method,
      path,
      RequestDataDefine: {},
      middlewares: [],
      requestStream: false,
      responseStream: false,
      propertyName,
    }
  }
}

export function get(path = '/') {
  return httpRequest('get', path)
}

export function post(path = '/') {
  return httpRequest('post', path)
}

export function getRoutes() {
  const router = new KoaRouter()
  const controllers = Array.from(controllerMap.values())
  controllers.forEach(controllerMeta => {
    const controller = new controllerMeta.constructor()
    const controllerRouter = new KoaRouter()
    router.use(controllerMeta.path, controllerRouter.routes())
    // TODO: middleware // maybe validator or authorzation check.

    const methods = Object.values(controllerMeta.methodMap)
    methods.forEach(methodMeta => {
      const middlewares: Middleware[] = []
      middlewares.push(async (ctx) => {
        // define data
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
      })
      // middleware
      middlewares.push(...methodMeta.middlewares)

      // run process
      middlewares.push(async (ctx) => {
        const result = await controller[methodMeta.propertyName](ctx.state, ctx)
        ctx.body = result
      })

      controllerRouter.register(methodMeta.path, [methodMeta.method], middlewares)
    })
  })
}
