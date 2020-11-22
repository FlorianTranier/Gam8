import { Client, TextChannel } from 'discord.js'
import DBMessageProvider from '../providers/database/messages/DBMessageProvider'
import CommandInterface from '../domain/services/commands/CommandInterface'
import DBChannelProvider from "../providers/database/channels/DBChannelProvider";

export default class CommandRouter {

    BOT_COMMAND_PREFIX = '-sp'

    private readonly client: Client
    private readonly commands: CommandInterface[]
    private readonly channelProvider: DBChannelProvider

    constructor(p: { client: Client, channelProvider: DBChannelProvider, commands: CommandInterface[] }) {
        this.client = p.client
        this.commands = p.commands
        this.channelProvider = p.channelProvider

        this.createEventMessage()
            .then(() => console.log(`${CommandRouter.name} OK`))
            .catch(() => console.error(`${CommandRouter.name} NOK`))
    }

    async createEventMessage(): Promise<void> {
        this.client.on('message', async (msg) => {

            const channelAssociation = await this.channelProvider.getByGuildId({
                guildId: msg.guild?.id || ''
            })

            if (msg.content.startsWith(`${this.BOT_COMMAND_PREFIX}`)
                && msg.channel instanceof TextChannel
                && msg.channel.id === channelAssociation?.channelId) {
                const command = await this.findCommandByPrefix({
                    prefix: await CommandRouter.getCommand({ content: msg.content })
                })

                if (!command) {
                    await msg.delete()
                    await msg.reply(`Invalid command : Type \`-sp help\` if you need help :)`)
                } else {
                    await command.exec({
                        args: await CommandRouter.getArgs({ content: msg.content }),
                        context: msg
                    })
                }
            }
        })
    }

    private static async getCommand(p: { content: string }): Promise<string> {
        return p.content.split(' ')[1]
    }

    private static async getArgs(p: { content: string }): Promise<string[]> {
        return p.content.split(' ').slice(2)
    }

    private async findCommandByPrefix(p: { prefix: string }): Promise<CommandInterface | undefined> {
        const bitmap = await Promise.all(
            this.commands.map(cmd => cmd.supportCommand({ command: p.prefix }))
        )
        return this.commands[bitmap.indexOf(true)]
    }

}