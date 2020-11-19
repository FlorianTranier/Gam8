import { firestore } from 'firebase-admin'
import SearchPartnerMessage from '../../../domain/models/messages/SearchPartnerMessage'

export default class {

  private readonly dbRef: firestore.CollectionReference

  constructor(p: { db: firestore.Firestore }) {
    this.dbRef = p.db.collection('messages')
  }

  async saveMessage(p: { message: SearchPartnerMessage }): Promise<SearchPartnerMessage> {
    return <SearchPartnerMessage>
      (await
        (await this.dbRef.add(JSON.parse(JSON.stringify(p.message)))).get())
        .data()
  }

  async getMessageByMessageId(p: { msgId: string }): Promise<SearchPartnerMessage> {
    return <SearchPartnerMessage>
      (await this.dbRef.where('messageId', '==', p.msgId).get())
        .docs[0].data()
  }

  async getMessagesByAuthorId(p: { authorId: string }): Promise<SearchPartnerMessage[]> {

    const docs = (await this.dbRef.where('authorId', '==', p.authorId).get())
      .docs

    return docs.map(doc => <SearchPartnerMessage>doc.data())

  }

}