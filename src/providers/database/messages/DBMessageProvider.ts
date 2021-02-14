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

  async deleteMessage(p: { msgId: string }): Promise<void> {
    const doc = (await this.dbRef.where('messageId', '==', p.msgId)
      .get()).docs[0]

    const msgRef = doc ? doc.ref : undefined

    if (msgRef) await msgRef.delete()
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

  async getMessagesByChannelId(p: { channelId: string }): Promise<SearchPartnerMessage[]> {
    const docs = (await this.dbRef.where('channelId', '==', p.channelId).get())
      .docs

    return docs.map(doc => <SearchPartnerMessage>doc.data())
  }

  async addMemberToMessageByMessageId(p: {msgId: string, memberId: string}): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
        .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    msgToUpdate.membersId.push(p.memberId)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

  async addLateMemberToMessageByMessageId(p: {msgId: string, memberId: string}): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
      .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    msgToUpdate.lateMembersId.push(p.memberId)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

  async removeMemberToMessageByMessageId(p: {msgId: string, memberId: string}): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
      .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    const indexToRemove = msgToUpdate.membersId.indexOf(p.memberId)
    if (indexToRemove > -1) msgToUpdate.membersId.splice(indexToRemove, 1)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

  async removeLateMemberToMessageByMessageId(p: {msgId: string, memberId: string}): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
      .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    const indexToRemove = msgToUpdate.lateMembersId.indexOf(p.memberId)
    if (indexToRemove > -1) msgToUpdate.lateMembersId.splice(indexToRemove, 1)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

  async addNotifiedMemberByMessageId(p: { msgId: string, memberId: string }): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
      .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    msgToUpdate.notifiedMembersId.push(p.memberId)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

  async removeNotifiedMemberByMessageId(p: { msgId: string, memberId: string }): Promise<SearchPartnerMessage> {
    const msgRef = (await this.dbRef.where('messageId', '==', p.msgId).get())
      .docs[0].ref

    const msgToUpdate = <SearchPartnerMessage>(await msgRef.get()).data()

    const indexToRemove = msgToUpdate.notifiedMembersId.indexOf(p.memberId)
    if (indexToRemove > -1) msgToUpdate.notifiedMembersId.splice(indexToRemove, 1)

    await msgRef.update(msgToUpdate)

    return await this.getMessageByMessageId({ msgId: p.msgId })
  }

}