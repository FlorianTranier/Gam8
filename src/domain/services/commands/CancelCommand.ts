import {
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
	TextBasedChannel,
} from 'discord.js'
import CommandInterface from './CommandInterface'
import pino from 'pino'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import EmbedSearchPartnerMessageUtils from '../../utils/EmbedSearchPartnerMessageUtils'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'

export default class CancelCommand implements CommandInterface {
	COMMAND = 'cancel'

	private readonly messageProvider: DBMessageProvider
	private readonly logger = pino({ level: 'info', name: 'CancelCommand' })

	constructor(p: { messageProvider: DBMessageProvider }) {
		this.messageProvider = p.messageProvider
	}

	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return new SlashCommandBuilder()
			.setDescription('Cancel all your Gam8 messages')
			.setName(this.COMMAND)
			.setDMPermission(false)
			.toJSON()
	}

	async supportCommand(p: { command: string }): Promise<boolean> {
		return p.command == this.COMMAND
	}

	async exec(p: { context: ChatInputCommandInteraction<CacheType> | undefined }): Promise<void> {
		await p.context?.deferReply({
			ephemeral: true,
		})
		await p.context?.deleteReply()

		const messages = await this.messageProvider.getMessagesByAuthorId({ authorId: p.context?.user.id ?? '' })

		const updatedMessages = await this.messageProvider.setMessagesExpired({
			msgIds: messages.map((msg) => msg.messageId),
			expired: true,
		})

		await Promise.all(
			updatedMessages.map(async (message) => {
				const discordChannel = <TextBasedChannel>p.context?.channel
				const discordMessage = await discordChannel?.messages.fetch({
					message: message.messageId,
					cache: false,
				})

				const author = await discordMessage.guild?.members.fetch(message.authorId)

				const embedMessage = await EmbedSearchPartnerMessageUtils.createOrUpdate({
					authorUsername: getDiscordUsername(author),
					authorPicture: author?.user.avatarURL() || undefined,
					membersId: message.membersId,
					lateMembersId: message.lateMembersId,
					games: message.games,
					locale: discordMessage.guild?.preferredLocale ?? 'en',
					additionalInformations: message.additionalInformations,
					expired: true,
				})

				return Promise.all([
					discordMessage.edit({
						embeds: [embedMessage],
						components: [],
					}),
					(async (): Promise<void> => this.logger.info(discordMessage, 'Set as expired'))(),
				])
			})
		)
	}
}
