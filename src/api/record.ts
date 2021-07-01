import { RecordQueryBll } from '../interface/record-query'
import mongodbCollectionRecordQueryBllImpl from '../bll/mongodb-collection-engine/record-query'

export class RecordAPI {
  private bll: RecordQueryBll<any, any> = mongodbCollectionRecordQueryBllImpl
  async query () {
    const resp = await this.bll.query({
      spaceId: '1',
      entityId: '2',
      filter: {
        'cf:abc': 123
      }
    })

    for await (const doc of resp) {
      doc.id
    }
  }
}

export default new RecordAPI()
