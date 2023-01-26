import { VideoGameProvider } from './../providers/rawg/games/VideoGameProvider'
import { Client, REST, Routes } from 'discord.js'
import CommandInterface from '../domain/services/commands/CommandInterface'
import DBChannelProvider from '../providers/database/channels/DBChannelProvider'

export default class CommandRouter {
  private readonly client: Client
  private readonly commands: CommandInterface[]
  private readonly channelProvider: DBChannelProvider
  private readonly videoGameProvider: VideoGameProvider

  constructor(p: {
    client: Client
    channelProvider: DBChannelProvider
    videoGameProvider: VideoGameProvider
    commands: CommandInterface[]
  }) {
    this.client = p.client
    this.commands = p.commands
    this.channelProvider = p.channelProvider
    this.videoGameProvider = p.videoGameProvider

    const commands = this.commands.map(command => command.getSlashCommand())

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN ?? '')
    rest
      .put(Routes.applicationCommands(process.env.BOT_CLIENT_ID ?? ''), { body: commands })
      .then(() => console.log(`UpdateCommands OK`))
      .catch(() => console.error(`UpdateCommands NOK`))

    this.createEventMessage()
      .then(() => console.log(`${CommandRouter.name} OK`))
      .catch(() => console.error(`${CommandRouter.name} NOK`))
  }

  async createEventMessage(): Promise<void> {
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isChatInputCommand()) return

      const command = await this.findCommandByPrefix({
        prefix: interaction.commandName,
      })

      if (!command) {
        await interaction.reply(`Invalid command : Type \`-sp help\` if you need help :)`)
      } else {
        await command.exec({
          context: interaction,
        })
      }
    })

    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isAutocomplete()) return
      const input = interaction.options.getFocused()

      await interaction.respond(
        (
          await this.videoGameProvider.searchGames({ searchInput: input })
        ).map(game => {
          return { name: game.name, value: game.name }
        })
      )
    })
  }

  private async findCommandByPrefix(p: { prefix: string }): Promise<CommandInterface | undefined> {
    const bitmap = await Promise.all(this.commands.map(cmd => cmd.supportCommand({ command: p.prefix })))
    return this.commands[bitmap.indexOf(true)]
  }
}
