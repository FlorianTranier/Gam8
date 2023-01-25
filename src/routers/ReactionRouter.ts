import { Client, MessageReaction } from 'discord.js'
import ReactionType from '../domain/models/messages/enums/ReactionType'
import DBMessageProvider from '../providers/database/messages/DBMessageProvider'
import ReactionInterface from '../domain/services/reactions/ReactionInterface'

export default class ReactionRouter {
  private readonly messageProvider: DBMessageProvider

  private readonly client: Client

  private readonly reactions: ReactionInterface[]

  constructor(p: { messageProvider: DBMessageProvider; client: Client; reactions: ReactionInterface[] }) {
    this.messageProvider = p.messageProvider
    this.client = p.client
    this.reactions = p.reactions

    this.createEventReaction()
      .then(() => console.log(`${ReactionRouter.name} OK`))
      .catch(() => console.error(`${ReactionRouter.name} NOK`))
  }

  private async createEventReaction(): Promise<void> {
    this.client.on('messageReactionAdd', async (reaction, author) => {
      if (author.id !== reaction?.message?.author?.id) {
        const bitmap = await Promise.all(
          this.reactions.map(react =>
            react.supportReaction({
              emoji: reaction.emoji.name ?? '',
              msgId: reaction.message.id,
              type: ReactionType.ADD,
            })
          )
        )
        await this.reactions[bitmap.indexOf(true)].exec({ reaction: reaction as MessageReaction, author })
      }
    })

    this.client.on('messageReactionRemove', async (reaction, author) => {
      const bitmap = await Promise.all(
        this.reactions.map(react =>
          react.supportReaction({
            emoji: reaction.emoji.name ?? '',
            msgId: reaction.message.id,
            type: ReactionType.REMOVE,
          })
        )
      )

      await this.reactions[bitmap.indexOf(true)].exec({ reaction: reaction as MessageReaction, author })
    })
  }
}
