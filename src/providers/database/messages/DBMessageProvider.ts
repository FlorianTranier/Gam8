import { Collection, Db } from 'mongodb'
import SearchPartnerMessage from '../../../domain/models/messages/SearchPartnerMessage'

export default class {
	private readonly dbRef: Collection

	constructor(p: { db: Db }) {
		this.dbRef = p.db.collection('messages')
	}

	async saveMessage(p: { message: SearchPartnerMessage }): Promise<void> {
		await this.dbRef.insertOne(p.message)
	}

	async deleteMessage(p: { msgId: string }): Promise<void> {
		await this.dbRef.deleteOne({ messageId: p.msgId })
	}

	async getMessageByMessageId(p: { msgId: string }): Promise<SearchPartnerMessage> {
		return (await this.dbRef.findOne<SearchPartnerMessage>({ messageId: p.msgId })) as SearchPartnerMessage
	}

	async getMessagesByAuthorId(p: { authorId: string }): Promise<SearchPartnerMessage[]> {
		return await this.dbRef
			.find<SearchPartnerMessage>({ authorId: p.authorId, expired: { $ne: true } })
			.sort({ timestamp: -1 })
			.limit(5)
			.toArray()
	}

	async getMessagesByChannelId(p: { channelId: string }): Promise<SearchPartnerMessage[]> {
		return await this.dbRef.find<SearchPartnerMessage>({ channelId: p.channelId, expired: { $ne: true } }).toArray()
	}

	async addMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $push: { membersId: p.memberId } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async addLateMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $push: { lateMembersId: p.memberId } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async removeMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $pull: { membersId: p.memberId } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async removeLateMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $pull: { lateMembersId: p.memberId } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async addNotifiedMemberByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne(
			{ messageId: p.msgId, expired: { $ne: true } },
			{ $push: { notifiedMembersId: p.memberId } }
		)
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async removeNotifiedMemberByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne(
			{ messageId: p.msgId, expired: { $ne: true } },
			{ $pull: { notifiedMembersId: p.memberId } }
		)
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async getLast5MessagesForChannel(p: { channelId: string }): Promise<SearchPartnerMessage[]> {
		return await this.dbRef
			.find<SearchPartnerMessage>({ channelId: p.channelId })
			.sort({ timestamp: -1 })
			.limit(5)
			.toArray()
	}

	async getUnexpiredMessagesBetweenDate(p: { start: Date; end: Date }): Promise<SearchPartnerMessage[]> {
		return await this.dbRef
			.find<SearchPartnerMessage>({ timestamp: { $gt: p.start, $lt: p.end }, expired: false })
			.toArray()
	}

	async setMessageExpired(p: { msgId: string; expired: boolean }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId }, { $set: { expired: p.expired } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}
}
