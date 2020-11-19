export default class GuildChannelAssociation {

  readonly guildId: string
  readonly channelId: string

  constructor(p: { guildId: string, channelId: string }) {
    this.guildId = p.guildId
    this.channelId = p.channelId
  }

}