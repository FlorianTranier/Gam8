import CommandInterface from './CommandInterface';
import {Message} from 'discord.js';
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider';

export default class TagCommand implements CommandInterface {

  COMMAND='tag'

  private readonly channelProvider: DBChannelProvider

  constructor(p: {channelProvider: DBChannelProvider}) {
    this.channelProvider = p.channelProvider
  }

  async supportCommand(p: { command: string }): Promise<boolean> {
    return p.command === this.COMMAND
  }

  async exec(p: { args: string[]; context: Message }): Promise<void> {

    if (!p.context.member?.permissions.has('MANAGE_MESSAGES')) {
      await p.context.delete()
      return
    }

    if (p.args[0] === 'reset') {
      const association = await this.channelProvider.getByGuildId({guildId: p.context.guild?.id || ''})
      if (association) {
        await this.channelProvider.updateTag({ guildId: association.guildId, tagId: undefined})
        await p.context.reply(`I'm not going to tag anybody now, I hope you're happy :'(`)
        await p.context.delete()
        return
      }
    }

    if (!p.args[0]?.startsWith('<@&')) {
      p.context?.reply('Not a valid role to tag')
      return
    }

    const sanitizedRoleId = p.args[0]
      .replace('<', '')
      .replace('>', '')
      .replace('@', '')
      .replace('&', '')

    const association = await this.channelProvider.getByGuildId({guildId: p.context.guild?.id || ''})

    if (association) {
      await this.channelProvider.updateTag({ guildId: association.guildId, tagId: sanitizedRoleId})
      await p.context.reply(`I will now tag my messages with this role ${p.args[0]} :)`)
      await p.context.delete()
    }

  }
}