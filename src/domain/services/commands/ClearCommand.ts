import CommandInterface from './CommandInterface'
import {
  PermissionFlagsBits,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'

export default class ClearCommand implements CommandInterface {
  COMMAND = 'clear'

  private readonly messageProvider: DBMessageProvider

  constructor(p: { messageProvider: DBMessageProvider }) {
    this.messageProvider = p.messageProvider
  }

  getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return new SlashCommandBuilder()
      .setDescription('Clear all bot messages')
      .setName(this.COMMAND)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .toJSON()
  }

  async supportCommand(p: { command: string }): Promise<boolean> {
    return p.command === this.COMMAND
  }

  async exec(p: { args: string[]; context: ChatInputCommandInteraction }): Promise<void> {
    p.context.reply('Not implemented right now, WIP')
    /*if (!p.context.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await p.context.delete()
      return
    }

    const messages = await this.messageProvider.getMessagesByChannelId({
      channelId: p.context.channel.id,
    })

    for (const message of messages) {
      await this.messageProvider.deleteMessage({
        msgId: message.messageId,
      })

      try {
        const discordMessage = await p.context.channel.messages.fetch(message.messageId)
        await discordMessage.delete()
      } catch (e) {}
    }

    const _ = ((await p.context.channel.messages.fetch()) as Collection<string, Message>)
      .filter(msg => msg.author.bot && !msg.pinned)
      .forEach(async msg => {
        try {
          if (msg.author.bot) await msg.delete()
        } catch (e) {}
      })

    await p.context.delete()
    */
  }
}
