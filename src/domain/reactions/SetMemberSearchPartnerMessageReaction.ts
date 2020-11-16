import { MessageReaction } from "discord.js";
import EmbedMessageGenerator from "../../commands/utils/EmbedSearchPartnerMessageUtils";
import MessageType from "../../models/messages/enums/MessageType";
import ReactionType from "../../models/messages/enums/ReactionType";
import DBMessageProvider from "../../providers/database/messages/DBMessageProvider";
import ReactionInterface from "./ReactionInterface";

export default class SetMemberSearchPartnerMessageReaction implements ReactionInterface {

  private readonly messageProvider: DBMessageProvider

  SUPPORTED_EMOJI = '☝'
  SUPPORTED_MESSAGE_TYPE = MessageType.RESEARCH_PARTNER
  SUPPORTED_REACTION_TYPES = [ReactionType.ADD, ReactionType.REMOVE]

  constructor(p: { messageProvider: DBMessageProvider }) {
    this.messageProvider = p.messageProvider
  }

  async supportReaction(p: { emoji: string, msgId: string, type: ReactionType }): Promise<boolean> {
    const message = await this.messageProvider
      .getMessageByMessageId({ msgId: p.msgId })

    return p.emoji.charCodeAt(0) === this.SUPPORTED_EMOJI.charCodeAt(0)
      && message.type === this.SUPPORTED_MESSAGE_TYPE
      && this.SUPPORTED_REACTION_TYPES.includes(p.type)
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