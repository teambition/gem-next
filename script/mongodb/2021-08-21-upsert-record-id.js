/* global db print */

let count = 0

db.record.find({
  id: null
}).forEach(record => {
  db.record.updateOne({
    _id: record._id,
  }, {
    $set: {
      id: record._id.str
    }
  })
  count++
})

print(`total count: ${count}`)
