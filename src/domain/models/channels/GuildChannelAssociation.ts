export default class GuildChannelAssociation {
	readonly guildId: string
	readonly channelId: string
	tagRoleId?: string

	constructor(p: { guildId: string; channelId: string; tagRoleId?: string }) {
		this.guildId = p.guildId
		this.channelId = p.channelId
		this.tagRoleId = p.tagRoleId
	}
}
