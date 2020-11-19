import { MessageEmbed, User } from 'discord.js';

export default {

  async createOrUpdate(p: {
    embedToUpdate?: MessageEmbed,
    authorUsername?: string,
    authorPicture?: string,
    game?: string,
    members?: User[],
    voiceChannelName?: string,
    voiceChannelInviteUrl?: string
  }): Promise<MessageEmbed> {
    const msg = p.embedToUpdate || new MessageEmbed()

    if (p.authorUsername && p.authorPicture) {
      msg.setAuthor(p.authorUsername, p.authorPicture || undefined)
    }

    if (p.game) {
      msg.setTitle(`${msg.author?.name} wants to play at ${p.game}`)
    }

    if (p.members) { //TODO : Fix this
      const membersDisplay = p.members.length > 0
        ? p.members.map(m => `<@${m.id}>`).join(',')
        : 'Waiting for players'

      const field = msg.fields.find(field => field.name === 'Answering the call')
      if (field) field.value = membersDisplay
    }


    if (p.voiceChannelName && p.voiceChannelInviteUrl) {
      const field = msg.fields.find(field => field.name === 'Join Channel:')

      if (field) {
        field.value = `[${p.voiceChannelName}](${p.voiceChannelInviteUrl})`
      } else {
        msg.addField('Join Channel:', `[${p.voiceChannelName}](${p.voiceChannelInviteUrl})`)
      }
    }

    return msg
  }

}