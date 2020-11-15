import { MessageReaction } from "discord.js";
import EmbedMessageGenerator from "../../commands/utils/EmbedSearchPartnerMessageUtils";
import MessageType from "../../models/messages/enums/MessageType";
import ReactionType from "../../models/messages/enums/ReactionType";
import DBMessageProvider from "../../providers/database/messages/DBMessageProvider";
import ReactionInterface from "./ReactionInterface";

export default class AddMemberSearchPartnerMessageReaction implements ReactionInterface {

  private readonly messageProvider: DBMessageProvider

  EMOJI = '☝'
  MESSAGE_TYPE = MessageType.RESEARCH_PARTNER
  REACTION_TYPE = ReactionType.ADD

  constructor(p: { messageProvider: DBMessageProvider }) {
    this.messageProvider = p.messageProvider
  }

  async supportReaction(p: { emoji: string, msgId: string, type: ReactionType }): Promise<boolean> {
    const message = await this.messageProvider
      .getMessageByMessageId({ msgId: p.msgId })

    return p.emoji.charCodeAt(0) === this.EMOJI.charCodeAt(0)
      && message.type === this.MESSAGE_TYPE
      && p.type === this.REACTION_TYPE
  }

  async exec(p: { reaction: MessageReaction }): Promise<void> {
    const message = await this.messageProvider
      .getMessageByMessageId({ msgId: p.reaction.message.id })

    const previousEmbedMessage = p.reaction.message.embeds[0]
    const members = (await p.reaction.users.fetch()).array()
      .filter(user => user.id !== p.reaction.message.author.id)

    const embedMessage = await EmbedMessageGenerator.create(
      {
        authorUsername: previousEmbedMessage.author?.name || '',
        authorPicture: previousEmbedMessage.author?.iconURL || '',
        game: message.game,
        members
      }
    )

    p.reaction.message.edit('@here', embedMessage)
  }



}