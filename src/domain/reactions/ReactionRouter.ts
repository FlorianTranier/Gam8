import { Client } from "discord.js";
import ReactionType from "../../models/messages/enums/ReactionType";
import DBMessageProvider from "../../providers/database/messages/DBMessageProvider";
import ReactionInterface from "./ReactionInterface";

export default class ReactionRouter {

  private readonly messageProvider: DBMessageProvider

  private readonly client: Client

  private readonly reactions: ReactionInterface[]

  constructor(p: { messageProvider: DBMessageProvider, client: Client, reactions: ReactionInterface[] }) {
    this.messageProvider = p.messageProvider
    this.client = p.client
    this.reactions = p.reactions

    this.createEventReaction()
  }

  async createEventReaction(): Promise<void> {
    this.client.on('messageReactionAdd', async reaction => {
      const bitmap = await Promise.all(
        this.reactions.map(react => react.supportReaction({
          emoji: reaction.emoji.name,
          msgId: reaction.message.id,
          type: ReactionType.ADD
        }))
      )

      this.reactions[bitmap.indexOf(true)].exec({ reaction })
    })

    this.client.on('messageReactionRemove', async reaction => {
      const bitmap = await Promise.all(
        this.reactions.map(react => react.supportReaction({
          emoji: reaction.emoji.name,
          msgId: reaction.message.id,
          type: ReactionType.REMOVE
        }))
      )

      this.reactions[bitmap.indexOf(true)].exec({ reaction })
    })
  }


}