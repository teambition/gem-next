import { MongodbCollectionRecordQueryBllImpl } from "../mongodb-collection-engine/record-query";

export class MongoRecord {
  private bll: MongodbCollectionRecordQueryBllImpl
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