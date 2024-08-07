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

	async findMessagesByMessageId(p: { msgIds: string[] }): Promise<SearchPartnerMessage[]> {
		return this.dbRef.find<SearchPartnerMessage>({ messageId: { $in: p.msgIds } }).toArray()
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

	async addMemberToMessageByMessageId(p: {
		msgId: string
		memberId: string
		games: string[]
	}): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne(
			{ messageId: p.msgId, expired: { $ne: true } },
			{ $push: { members: { id: p.memberId, games: p.games } } }
		)
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async addLateMemberToMessageByMessageId(p: {
		msgId: string
		memberId: string
		games: string[]
	}): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne(
			{ messageId: p.msgId, expired: { $ne: true } },
			{ $push: { lateMembers: { id: p.memberId, games: p.games } } }
		)
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async removeMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $pull: { members: { id: p.memberId } } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async removeLateMemberToMessageByMessageId(p: { msgId: string; memberId: string }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId, expired: { $ne: true } }, { $pull: { lateMembers: { id: p.memberId } } })
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

	async getLast10Games(p: { channelId: string }): Promise<string[]> {
		return (
			await this.dbRef
				.aggregate<{ _id: string }>([
					{ $match: { channelId: p.channelId } },
					{ $unwind: '$games' },
					{
						$group: {
							_id: '$games',
							timestamp: { $max: '$timestamp' },
						},
					},
					{ $sort: { timestamp: -1 } },
					{ $limit: 10 },
				])
				.toArray()
		).map((doc) => doc._id)
	}

	async getUnexpiredMessagesBetweenDate(p: { start: Date; end: Date }): Promise<SearchPartnerMessage[]> {
		return await this.dbRef
			.find<SearchPartnerMessage>({ timestamp: { $gt: p.start.getTime(), $lt: p.end.getTime() }, expired: false })
			.toArray()
	}

	async setMessageExpired(p: { msgId: string; expired: boolean }): Promise<SearchPartnerMessage> {
		await this.dbRef.updateOne({ messageId: p.msgId }, { $set: { expired: p.expired } })
		return await this.getMessageByMessageId({ msgId: p.msgId })
	}

	async setMessagesExpired(p: { msgIds: string[]; expired: boolean }): Promise<SearchPartnerMessage[]> {
		await this.dbRef.updateMany(
			{
				messageId: { $in: p.msgIds },
			},
			{ $set: { expired: p.expired } }
		)
		return await this.findMessagesByMessageId({ msgIds: p.msgIds })
	}

	async cloneMessage(p: { msgId: string; newMsgId: string, authorId?: string }): Promise<void> {
		const message = await this.getMessageByMessageId({ msgId: p.msgId })
		delete message._id
		await this.saveMessage({
			message: {
				...message, messageId: p.newMsgId, authorId: p.authorId || '', additionalInformations: undefined, members: [], lateMembers: [], notifiedMembersId: [], expired: false, timestamp: new Date().getTime()
			}
		})
	}
}
