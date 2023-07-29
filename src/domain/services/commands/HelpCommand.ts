import CommandInterface from './CommandInterface'
import {
	ChatInputCommandInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	SlashCommandBuilder,
} from 'discord.js'

export default class HelpCommand implements CommandInterface {
	COMMAND = 'help'

	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return new SlashCommandBuilder().setDescription('Get help !').setName(this.COMMAND).toJSON()
	}

	async supportCommand(p: { command: string }): Promise<boolean> {
		return p.command === this.COMMAND
	}

	async exec(p: { args: string[]; context: ChatInputCommandInteraction }): Promise<void> {
		await p.context.reply({
			content: `
\`/search <game>\` : Say that you want to play at <game>, and wait for other players answers
\`/clear\` : Remove all messages from this bot (only if you have the permission to edit messages)
\`/help\` : display this message
\`/tag @role|reset\` : choose a role to tag when a new search message is created (only if you have the permission to edit messages)
`,
		})
	}
}
