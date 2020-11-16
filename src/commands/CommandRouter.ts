import { Client } from 'discord.js'
import DBMessageProvider from '../providers/database/messages/DBMessageProvider'
import CommandInterface from './CommandInterface'

export default class {

    BOT_COMMAND_PREFIX = '-sp'

    private readonly client: Client
    private readonly commands: CommandInterface[]

    constructor(p: { client: Client, messageProvider: DBMessageProvider, commands: CommandInterface[] }) {
        this.client = p.client
        this.commands = p.commands

        this.createEventMessage()
    }

    async createEventMessage(): Promise<void> {
        this.client.on('message', async (msg) => {
            if (msg.content.startsWith('-sp')) {
                const command = await this.findCommandByPrefix({
                    prefix: await this.getCommand({ content: msg.content })
                })
                await command?.exec({
                    args: await this.getArgs({ content: msg.content }),
                    context: msg
                })
            }
        })
    }

    private async getCommand(p: { content: string }): Promise<string> {
        return p.content.split(' ')[1]
    }

    private async getArgs(p: { content: string }): Promise<string[]> {
        return p.content.split(' ').slice(2)
    }

    private async findCommandByPrefix(p: { prefix: string }): Promise<CommandInterface | undefined> {
        const bitmap = await Promise.all(
            this.commands.map(cmd => cmd.supportCommand({ command: p.prefix }))
        )
        return this.commands[bitmap.indexOf(true)]
    }

}