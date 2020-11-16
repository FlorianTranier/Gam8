import { Message } from "discord.js";
import MessageType from "../models/messages/enums/MessageType";
import SearchPartnerMessage from "../models/messages/SearchPartnerMessage";
import DBMessageProvider from "../providers/database/messages/DBMessageProvider";
import CommandInterface from "./CommandInterface";
import EmbedMessageGenerator from "./utils/EmbedSearchPartnerMessageUtils";

export default class SPCommand implements CommandInterface {

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

    const message = await p.context.channel.send('@here',
      await EmbedMessageGenerator.create(
        {
          authorUsername: p.context.author.username,
          authorPicture: p.context.author.avatarURL() || '',
          game,
          members: []
        }
      )
    )

    message.react('☝')

    await this.messageProvider.saveMessage({
      message: new SearchPartnerMessage({
        serverId: p.context.guild?.id || '',
        authorId: p.context.author.id,
        messageId: message.id,
        game,
        type: MessageType.RESEARCH_PARTNER,
        membersId: []
      })
    })

    p.context.delete()
  }

}