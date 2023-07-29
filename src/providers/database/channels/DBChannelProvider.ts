import { firestore } from 'firebase-admin'
import GuildChannelAssociation from '../../../domain/models/channels/GuildChannelAssociation'

export default class {
	private readonly dbRef: firestore.CollectionReference

	constructor(p: { db: firestore.Firestore }) {
		this.dbRef = p.db.collection('channels')
	}

	async saveGuildChannelAssociation(p: {
		guildChannelAssociation: GuildChannelAssociation
	}): Promise<GuildChannelAssociation> {
		return <GuildChannelAssociation>(
			(await (await this.dbRef.add(JSON.parse(JSON.stringify(p.guildChannelAssociation)))).get()).data()
		)
	}

	async updateTag(p: { guildId: string; tagId?: string }): Promise<void> {
		const associationRef = (await this.dbRef.where('guildId', '==', p.guildId).get()).docs[0].ref

		const toUpdate = <GuildChannelAssociation>(await associationRef.get()).data()

		toUpdate.tagRoleId = p.tagId ?? ''

		await associationRef.update(toUpdate)
	}

	async getByGuildId(p: { guildId: string }): Promise<GuildChannelAssociation | null> {
		const doc = (await this.dbRef.where('guildId', '==', p.guildId).get()).docs[0]

		return doc ? <GuildChannelAssociation>doc.data() : null
	}
}
