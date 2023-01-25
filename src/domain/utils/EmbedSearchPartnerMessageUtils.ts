import { EmbedBuilder, resolveColor } from 'discord.js'

export default {
  async createOrUpdate(p: {
    authorUsername?: string
    authorPicture?: string
    game: string
    membersId: string[]
    lateMembersId: string[]
    voiceChannelName?: string
    voiceChannelInviteUrl?: string
    img: string
  }): Promise<EmbedBuilder> {
    const msg = new EmbedBuilder()

    const membersDisplay = p.membersId.length > 0 ? p.membersId.map(m => `<@${m}>`).join(', ') : 'Waiting for players'

    msg
      .setAuthor({
        name: p.authorUsername ?? '',
        iconURL: p.authorPicture || undefined,
      })
      .setTitle(`${p.authorUsername} wants to play at ${p.game}`)
      .addFields([{ name: 'Answering the call', value: membersDisplay }])
      .setThumbnail(p.img)
      .setTimestamp()
      .setColor(resolveColor('Random'))

    if (p.lateMembersId.length > 0) {
      const lateMembersDisplay = p.lateMembersId.map(m => `<@${m}>`).join(',')
      msg.addFields([{ name: 'Maybe joining later', value: lateMembersDisplay || 'Waiting for players' }])
    }

    if (p.voiceChannelName && p.voiceChannelInviteUrl) {
      msg.addFields([{ name: 'Join Channel:', value: `[${p.voiceChannelName}](${p.voiceChannelInviteUrl})` }])
    }

    return msg
  },
}
