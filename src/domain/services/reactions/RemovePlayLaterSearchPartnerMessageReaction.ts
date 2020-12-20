import {MessageReaction, PartialUser, User} from 'discord.js';
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils';
import MessageType from '../../models/messages/enums/MessageType';
import ReactionType from '../../models/messages/enums/ReactionType';
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider';
import ReactionInterface from './ReactionInterface';

export default class AddPlayLaterSearchPartnerMessageReaction implements ReactionInterface {

  private readonly messageProvider: DBMessageProvider

  SUPPORTED_EMOJI = '⏰'
  SUPPORTED_MESSAGE_TYPE = MessageType.RESEARCH_PARTNER
  SUPPORTED_REACTION_TYPES = [ReactionType.REMOVE]

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

  async exec(p: { reaction: MessageReaction; author: User | PartialUser }): Promise<void> {
    const message = await this.messageProvider.removeLateMemberToMessageByMessageId({
      msgId: p.reaction.message.id,
      memberId: p.author.id
    })

    const author = (await p.reaction.message.guild?.members.fetch(message.authorId))

    const embedMessage = await EmbedMessageGenerator.createOrUpdate(
      {
        authorUsername: author?.user.username,
        authorPicture: author?.user.avatarURL() || undefined,
        membersId: message.membersId,
        lateMembersId: message.lateMembersId,
        game: message.game,
        voiceChannelName: author?.voice.channel?.name,
        voiceChannelInviteUrl: (await author?.voice.channel?.createInvite())?.url,
        img: message.catUrl
      }
    )

    await p.reaction.message.edit(embedMessage)
  }



}