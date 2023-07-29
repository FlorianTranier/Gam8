import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'

export default interface CommandInterface {
	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody

	supportCommand(p: { command: string }): Promise<boolean>

	exec(p: { context: ChatInputCommandInteraction | undefined }): Promise<void>
}
