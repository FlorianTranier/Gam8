import { Collection, Db } from 'mongodb'
import GuildChannelAssociation from '../../../domain/models/channels/GuildChannelAssociation'

export default class {
	private dbRef: Collection

	constructor(p: { db: Db }) {
		this.dbRef = p.db.collection('channels')
	}

	async saveGuildChannelAssociation(p: { guildChannelAssociation: GuildChannelAssociation }): Promise<void> {
		await this.dbRef.insertOne(p.guildChannelAssociation)
	}

	async updateTag(p: { guildId: string; tagId?: string }): Promise<void> {
		await this.dbRef.updateOne({ guildId: p.guildId }, { $set: { tagRoleId: p.tagId ?? '' } })
	}

	async getByGuildId(p: { guildId: string }): Promise<GuildChannelAssociation | null> {
		const doc = await this.dbRef.find<GuildChannelAssociation>({ guildId: p.guildId }).toArray()
		return doc[0] ? doc[0] : null
	}
}
