import { Message } from 'discord.js';
import MessageType from '../../models/messages/enums/MessageType';
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage';
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider';
import CommandInterface from './CommandInterface';
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils';
import axios from 'axios'

export default class SearchCommand implements CommandInterface {

  COMMAND = 'search'

  private readonly messageProvider: DBMessageProvider

  constructor(p: { messageProvider: DBMessageProvider }) {
    this.messageProvider = p.messageProvider
  }

  async supportCommand(p: { command: string; }): Promise<boolean> {
    return p.command == this.COMMAND
  }

  async exec(p: { args: string[], context: Message }): Promise<void> {

    const game = p.args.join(' ')

    const imgUrl = (await axios.get('https://api.thecatapi.com/v1/images/search')).data[0].url

    const author = (await p.context.guild?.members.fetch(p.context.author.id))

    const message = await p.context.channel.send('@here',
      await EmbedMessageGenerator.createOrUpdate(
        {
          authorUsername: p.context.author.username,
          authorPicture: p.context.author.avatarURL() || '',
          game,
          membersId: [],
          lateMembersId: [],
          img: imgUrl,
          voiceChannelName: author?.voice.channel?.name,
          voiceChannelInviteUrl: (await author?.voice.channel?.createInvite())?.url,
        }
      )
    )

    await message.react('☝')
    await message.react('⏰')

    await this.messageProvider.saveMessage({
      message: new SearchPartnerMessage({
        serverId: p.context.guild?.id || '',
        authorId: p.context.author.id,
        messageId: message.id,
        game,
        type: MessageType.RESEARCH_PARTNER,
        membersId: [],
        lateMembersId: [],
        channelId: p.context.channel.id,
        catUrl: imgUrl
      })
    })

    await p.context.delete()
  }

}