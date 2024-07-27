import { VideoGameProvider } from './../providers/rawg/games/VideoGameProvider'
import { Client, REST, Routes } from 'discord.js'
import CommandInterface from '../domain/services/commands/CommandInterface'
import DBMessageProvider from '../providers/database/messages/DBMessageProvider'
import pino from 'pino'
import EventCommand from '../domain/services/commands/EventCommand'

export default class CommandRouter {
	private readonly client: Client
	private readonly commands: CommandInterface[]
	private readonly messageProvider: DBMessageProvider
	private readonly videoGameProvider: VideoGameProvider
	private readonly logger = pino({ level: 'info', name: 'CommandRouter' })

	constructor(p: {
		client: Client
		messageProvider: DBMessageProvider
		videoGameProvider: VideoGameProvider
		commands: CommandInterface[]
	}) {
		this.client = p.client
		this.commands = p.commands
		this.messageProvider = p.messageProvider
		this.videoGameProvider = p.videoGameProvider

		const commands = this.commands.map((command) => command.getSlashCommand())

		const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN ?? '')
		rest
			.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID ?? ''), { body: commands })
			.then(() => this.logger.info(`UpdateCommands OK`))
			.catch(() => this.logger.error(`UpdateCommands NOK`))

		this.createEventMessage()
			.then(() => this.logger.info(`${CommandRouter.name} OK`))
			.catch(() => this.logger.error(`${CommandRouter.name} NOK`))
	}

	async createEventMessage(): Promise<void> {
		this.client.on('interactionCreate', async (interaction) => {
			if (!interaction.isChatInputCommand()) return

			const command = await this.findCommandByPrefix({
				prefix: interaction.commandName,
			})

			if (!command) {
				await interaction.reply(`Invalid command : Type \`/help\` if you need help :)`)
			} else {
				await command.exec({
					context: interaction,
				})
			}
		})

		this.client.on('interactionCreate', async (interaction) => {
			if (!interaction.isAutocomplete()) return
			const input = interaction.options.getFocused()

			const games =
				input.length === 0
					? (await this.messageProvider.getLast10Games({ channelId: interaction.channelId })).map((game) => {
						return {
							name: game,
							value: game,
						}
					})
					: await this.videoGameProvider.searchGames({ searchInput: input })

			try {
				await interaction.respond(
					games.map((game) => {
						return { name: game.name, value: game.name }
					})
				)
			} catch (e) {
				/* empty */
			} // NON BLOCKING ERROR
		})

		this.client.on('interactionCreate', async (interaction) => {
			if (!interaction.isModalSubmit()) return

			if (interaction.customId === 'modalEvent') {
				(this.commands.find((cmd) => cmd instanceof EventCommand) as EventCommand)?.submitHandler({ context: interaction })
			}
		})
	}

	private async findCommandByPrefix(p: { prefix: string }): Promise<CommandInterface | undefined> {
		const bitmap = await Promise.all(this.commands.map((cmd) => cmd.supportCommand({ command: p.prefix })))
		return this.commands[bitmap.indexOf(true)]
	}
}
