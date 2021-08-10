import { Query } from 'mingo'

const database = {}

export function replaceCollection(name, collection) {
  database[name] = collection
}

export class MemoryMongoClient {
  static connect(any) { return new MemoryMongoClient() }
  db () {
    return new MemoryMongoDb()
  }
}

export class MemoryMongoDb {
  collection (collection: string) {
    return new MemoryMongoCollection({ collection })
  }
}

export class MemoryMongoCollection {
  collection = ''
  constructor({collection}) {
    this.collection = collection
  }

  find (condition) {
    const query = new Query(condition)
    const result =  query.find(database[this.collection] || [])
    Object.assign(result, { stream: () => result })
    return result
    // return new MemoryMongoCursor({ collection: this.collection, condition })
  } 
}

export class MongoClient extends MemoryMongoClient {}

export class MemoryMongoCursor {
  start = 0
  end = 0
  collection = ''
  condition = ''

  constructor({ collection, condition }) {

  }
  skip(n: number) {
    this.start = n
  }

  limit(n: number) {
    this.end = n
  }

  stream() {
    return this
  }

  // [Symbol.asyncIterator] () {
  //   // database[]
  // }
}