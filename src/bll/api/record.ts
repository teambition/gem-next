import { RecordQueryBll } from '../../interface/record-query'
import mongodbCollectionRecordQueryBllImpl from '../mongodb-collection-engine/record-query'

export class RecordAPI {
  private bll: RecordQueryBll<any, any> = mongodbCollectionRecordQueryBllImpl
  async main () {
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