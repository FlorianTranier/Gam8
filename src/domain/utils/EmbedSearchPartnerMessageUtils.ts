import { MessageEmbed } from 'discord.js';

export default {

  async createOrUpdate(p: {
    authorUsername?: string,
    authorPicture?: string,
    game: string,
    membersId: string[],
    lateMembersId: string[],
    voiceChannelName?: string,
    voiceChannelInviteUrl?: string,
    img: string
  }): Promise<MessageEmbed> {
    const msg = new MessageEmbed()

    const membersDisplay = p.membersId.length > 0
        ? p.membersId.map(m => `<@${m}>`).join(', ')
        : 'Waiting for players'

    msg
      .setAuthor(p.authorUsername, p.authorPicture || undefined)
      .setTitle(`${msg.author?.name} wants to play at ${p.game}`)
      .addField('Answering the call', membersDisplay)
      .setImage(p.img)

    if (p.lateMembersId.length > 0) {
      const lateMembersDisplay = p.lateMembersId.map(m => `<@${m}>`).join(',')
      msg.addField('Maybe joining later', lateMembersDisplay || 'Waiting for players')
    }

    if (p.voiceChannelName && p.voiceChannelInviteUrl) {
        msg.addField('Join Channel:', `[${p.voiceChannelName}](${p.voiceChannelInviteUrl})`)
    }

    return msg
  }

}