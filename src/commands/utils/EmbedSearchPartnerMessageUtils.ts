import { MessageEmbed, User } from "discord.js";

export default {

  async create(p: {
    authorUsername: string,
    authorPicture: string,
    game: string,
    members: User[]
  }): Promise<MessageEmbed> {
    const msg = new MessageEmbed()

    const membersDisplay = p.members.length > 0
      ? p.members.map(m => `<@${m.id}>`).join(',')
      : 'Waiting for players'

    return msg
      .setAuthor(p.authorUsername, p.authorPicture || undefined)
      .setTitle(`${p.authorUsername} wants to play at ${p.game}`)
      .addField('Answering the call', membersDisplay)
  }

}