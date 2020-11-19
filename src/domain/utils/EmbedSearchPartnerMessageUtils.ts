import { MessageEmbed } from 'discord.js';

export default {

  async createOrUpdate(p: {
    authorUsername?: string,
    authorPicture?: string,
    game: string,
    membersId: string[],
    voiceChannelName?: string,
    voiceChannelInviteUrl?: string
  }): Promise<MessageEmbed> {
    const msg = new MessageEmbed()

    const membersDisplay = p.membersId.length > 0
        ? p.membersId.map(m => `<@${m}>`).join(',')
        : 'Waiting for players'

    msg.setAuthor(p.authorUsername, p.authorPicture || undefined)
        .setTitle(`${msg.author?.name} wants to play at ${p.game}`)
        .addField('Answering the call', membersDisplay)

    if (p.voiceChannelName && p.voiceChannelInviteUrl) {
        msg.addField('Join Channel:', `[${p.voiceChannelName}](${p.voiceChannelInviteUrl})`)
    }

    return msg
  }

}