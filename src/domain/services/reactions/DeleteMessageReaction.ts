import { MessageReaction, User, PartialUser } from 'discord.js';
import ReactionType from '../../models/messages/enums/ReactionType';
import ReactionInterface from './ReactionInterface'
import MessageType from '../../models/messages/enums/MessageType'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'

export default class DeleteMessageReaction implements ReactionInterface {

    private readonly messageProvider: DBMessageProvider
    
    SUPPORTED_EMOJI = '🚫' 
    SUPPORTED_MESSAGE_TYPE = MessageType.RESEARCH_PARTNER
    SUPPORTED_REACTION_TYPES = [ReactionType.ADD]
    
    constructor(p: { messageProvider: DBMessageProvider }) {
        this.messageProvider = p.messageProvider
    }

    async supportReaction(p: { emoji: string; msgId: string; type: ReactionType; }): Promise<boolean> {
        const message = await this.messageProvider
            .getMessageByMessageId({ msgId: p.msgId })

        return p.emoji === this.SUPPORTED_EMOJI
          && message.type === this.SUPPORTED_MESSAGE_TYPE
          && this.SUPPORTED_REACTION_TYPES.includes(p.type)
    }

    async exec(p: { reaction: MessageReaction; author: User | PartialUser; }): Promise<void> {
        if (p.reaction.message.author.id === p.author.id) return

        const message = await this.messageProvider
            .getMessageByMessageId({ msgId: p.reaction.message.id })
        
        if (message.authorId !== p.author.id) {
            await p.reaction.remove()
            return
        }

        await p.reaction.message.delete()
        await this.messageProvider.deleteMessage({ msgId: message.messageId})
    }

}