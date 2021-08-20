/* global db */

// labels index
db.record.createIndex({
  labels: 1,
}, {
  background: true
})

// spaceId, entityId, labels compond index
db.record.createIndex({
  spaceId: 1,
  entityId: 1,
  labels: 1,
}, {
  background: true
})

// spaceId, entityId, id compond index
db.record.createIndex({
  spaceId: 1,
  entityId: 1,
  id: 1,
}, {
  // unique: true,
  background: true,
})

