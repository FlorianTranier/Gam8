import { MessageReaction } from 'discord.js';
import ReactionType from '../../models/messages/enums/ReactionType';

export default interface ReactionInterface {

  supportReaction(p: { emoji: string, msgId: string, type: ReactionType }): Promise<boolean>

  exec(p: { reaction: MessageReaction }): Promise<void>

}