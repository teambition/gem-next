/* global db */

// labels index
db.record.createIndex({
  labels: 1,
}, {
  background: true
})

// spaceId, labels compond index
db.record.createIndex({
  spaceId: 1,
  isDeleted: 1,
  labels: 1,
  _id: 1,
}, {
  background: true
})

