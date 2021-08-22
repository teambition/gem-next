import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import * as typescript from 'typescript'
import { getRouter, controllerMap } from './decorator'

export function generateOpenApiDoc() {
  const result: any = {
    openapi: '3.0.0',
    info: {
      title: 'package.name', // openapi title or package name
      description: 'package.description', // openapi description or package description
      version: 'package.version', // openapi version or package version
      contact: {
        name: 'package.author.name',
        email: 'package.author.email', // openapi contact email or package maintainer or package author
      },
      license: {
        name: 'Apache 2.0', // openapi license or package
        url: 'http://www.apache.org/licenses/LICENSE-2.0.html', // openapi license or package
      },
    },
    tags: [],
    paths: {},
  }

  Array.from(controllerMap.values()).forEach(controllerMeta => {
    if (!controllerMeta.prefix) return
    Object.values(controllerMeta.methodMap).forEach(methodMeta => {
      const fullpath = path.join(controllerMeta.prefix, methodMeta.path).replace(/\/$/, '')
      const pathObj: any = result.paths[fullpath] = result.paths[fullpath] || {}
      const requestBodySchema = methodMeta.validator?.schema
      const responseBodySchema = {}
      pathObj[methodMeta.verb] = {
        summary: 'methodMeta.name',
        description: '',
        consumes: ['application/json'],
        produces: ['application/json'],
        parameters: {},
        requestBody: {
          description: '',
          content: {
            'application/json': {
              schema: requestBodySchema,
              // examples: { [string]: { summary: '', value: obj } ... },
            },
          },
        },
        responses: {
          default: {
            description: '',
            content: {
              'application/json': {
                schema: responseBodySchema,
              }
            }
          }
        }
      }
    })
  })

  console.log(JSON.stringify(result, null, 2))
  return result
}

export function generateTypeDoc() {
  const p = typescript.createProgram(['src/app.ts', 'src/api/record.ts'], {})
  // const file = 'src/api/record.ts'
  // const filepath = path.resolve(__dirname, '../../', file)
  // const p = typescript.createSourceFile(
  //   file,
  //   fs.readFileSync(filepath).toString(),
  //   typescript.ScriptTarget.ES2017,
  // )

  const checker = p.getTypeChecker()
  p.getSourceFiles().forEach(sourceFile => {
    if (sourceFile.isDeclarationFile) return
    console.log('sourceFile', sourceFile.fileName)
    // console.log(p)
    typescript.forEachChild(sourceFile, (node) => {
      // console.log('----', node.kind)
      // typescript.isClassDeclaration(node) || typescript.isModuleDeclaration(node) ||
      if (!isNodeExported(node)) return
      // console.log((node as any).name)
      // if ((node as any).name) {
      if (!typescript.isClassDeclaration(node)) return

      const symbol = checker.getSymbolAtLocation((node as any).name)
      if (!symbol) return
      const className = symbol.getName()
      const commentParts = symbol.getDocumentationComment(null)
      const jsDocTags = symbol.getJsDocTags()
      // console.log('++++ commentParts', commentParts) // summary
      // console.log('++++ jsDocTags', jsDocTags) // summary => summary
      console.log(`class ${className}: ${commentParts.map(p => p.text).join('__')} jsDoc: ${JSON.stringify(jsDocTags)}`)

      typescript.forEachChild(node, (node) => {
        if (!typescript.isMethodDeclaration(node)) return

        const symbol = checker.getSymbolAtLocation(node.name)
        if (!symbol) return
        const methodName = symbol.getName()
        const commentParts = symbol.getDocumentationComment(null)
        const jsDocTags = symbol.getJsDocTags()
        console.log(`${className}.${methodName}: ${commentParts.map(p => p.text).join('__')} jsDoc: ${JSON.stringify(jsDocTags)}`)
          
      })

          // if (commentParts.length) {
          //   console.log('----commentPart', commentParts[0].text)
          //   // console.log('----', node.kind, (node as any).name)
          //   console.log(commentParts)
          // }
        // }
      // }
    })
  })
}

function isNodeExported(node: typescript.Node): boolean {
  return (
    (typescript.getCombinedModifierFlags(node as typescript.Declaration) & typescript.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === typescript.SyntaxKind.SourceFile)
  )
}

generateTypeDoc()
