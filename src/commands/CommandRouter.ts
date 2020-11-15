import { Client } from 'discord.js'
import DBMessageProvider from '../providers/database/messages/DBMessageProvider'
import CommandInterface from './CommandInterface'

export default class {

    private readonly client: Client
    private readonly commands: CommandInterface[]

    constructor(p: { client: Client, messageProvider: DBMessageProvider, commands: CommandInterface[] }) {
        this.client = p.client
        this.commands = p.commands

        this.createEventMessage()
    }

    async createEventMessage(): Promise<void> {
        this.client.on('message', async (msg) => {
            const command = await this.findCommandByPrefix({
                prefix: await this.getPrefix({ content: msg.content })
            })
            await command?.exec({
                args: await this.getArgs({ content: msg.content }),
                context: msg
            })
        })
    }

    private async getPrefix(p: { content: string }): Promise<string> {
        return p.content.split(' ')[0]
    }

    private async getArgs(p: { content: string }): Promise<string[]> {
        return p.content.split(' ').slice(1)
    }

    private async findCommandByPrefix(p: { prefix: string }): Promise<CommandInterface | undefined> {
        const bitmap = await Promise.all(
            this.commands.map(cmd => cmd.supportCommand({ command: p.prefix }))
        )
        return this.commands[bitmap.indexOf(true)]
    }
    /*
    this.client.on('message', async (msg) => {
            console.log(msg.content)
            if (msg.content.startsWith('-sp')) {
                const splittedMsg = msg.content.split(' ')
                splittedMsg.shift()
                const game = splittedMsg.join(' ')
                await this.messageProvider.saveMessage({
                    message: new SearchPartnerMessage({
                        serverId: msg.guild?.id || '',
                        authorId: msg.author.id,
                        messageId: msg.id,
                        game
                    })
                })
                await msg.reply('coucou')
            }
        })
        */
}