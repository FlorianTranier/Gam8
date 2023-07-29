import CommandInterface from './CommandInterface'
import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	SlashCommandBuilder,
} from 'discord.js'
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider'

export default class TagCommand implements CommandInterface {
	COMMAND = 'tag'

	private readonly channelProvider: DBChannelProvider

	constructor(p: { channelProvider: DBChannelProvider }) {
		this.channelProvider = p.channelProvider
	}

	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return new SlashCommandBuilder()
			.setDescription('Choose a role to tag when a new search message is created')
			.addRoleOption((option) => option.setName('tag').setDescription('tag').setRequired(true))
			.setName(this.COMMAND)
			.setDMPermission(false)
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

			.toJSON()
	}

	async supportCommand(p: { command: string }): Promise<boolean> {
		return p.command === this.COMMAND
	}

	async exec(p: { context: ChatInputCommandInteraction }): Promise<void> {
		/*if (!p.context.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await p.context.delete()
      return
    }*/

		/*if (p.args[0] === 'reset') {
      const association = await this.channelProvider.getByGuildId({ guildId: p.context.guild?.id || '' })
      if (association) {
        await this.channelProvider.updateTag({ guildId: association.guildId, tagId: undefined })
        await p.context.reply(`I'm not going to tag anybody now, I hope you're happy :'(`)
        await p.context.delete()
        return
      }
    }

    if (!p.args[0]?.startsWith('<@&')) {
      p.context?.reply('Not a valid role to tag')
      return
    }

    const sanitizedRoleId = p.args[0].replace('<', '').replace('>', '').replace('@', '').replace('&', '')
*/
		const association = await this.channelProvider.getByGuildId({ guildId: p.context.guild?.id || '' })

		if (association) {
			await this.channelProvider.updateTag({
				guildId: association.guildId,
				tagId: p.context.options.getRole('tag')?.id,
			})
			await p.context.reply(`I will now tag my messages with this role <@&${p.context.options.getRole('tag')?.id}> :)`)
		}
	}
}
