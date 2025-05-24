import { Client, MessageFlags, TextChannel } from 'discord.js'
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import pino from 'pino'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'
import ComponentSearchPartnerMessageUtils from '../../utils/ComponentSearchPartnerMessageUtils'
import SearchCommand from '../commands/SearchCommand'
import { VideoGameProvider } from '../../../providers/rawg/games/VideoGameProvider'

export default class VoiceStateListener {
	private readonly client: Client

	private readonly messageProvider: DBMessageProvider

	private readonly channelProvider: DBChannelProvider

	private readonly videoGameProvider: VideoGameProvider

	private readonly logger = pino({ level: 'info', name: 'VoiceStateListener' })

	constructor(p: {
		client: Client
		messageProvider: DBMessageProvider
		channelProvider: DBChannelProvider
		videoGameProvider: VideoGameProvider
	}) {
		this.client = p.client
		this.messageProvider = p.messageProvider
		this.channelProvider = p.channelProvider
		this.videoGameProvider = p.videoGameProvider
		this.createVoiceStateListener()
			.then(() => this.logger.info(`${VoiceStateListener.name} OK`))
			.catch(() => this.logger.error(`${VoiceStateListener.name} NOK`))
	}

	private async createVoiceStateListener() {
		this.client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
			const userId = newVoiceState.member?.user.id || ''

			const messages = await this.messageProvider.getMessagesByAuthorId({
				authorId: userId,
			})

			const botChannelId = (
				await this.channelProvider.getByGuildId({
					guildId: newVoiceState.guild.id,
				})
			)?.channelId

			const botChannel = botChannelId
				? newVoiceState.guild.channels.cache.find((channel) => channel.id === botChannelId)
				: undefined

			if (botChannel && botChannel instanceof TextChannel) {
				for (const message of messages) {
					const author = await newVoiceState.guild?.members.fetch(message.authorId)

					const gameInfos = await Promise.all(
						message.games.map((game) => SearchCommand.getGameInfos(game, this.videoGameProvider))
					)

					const selectRow = SearchCommand.createSelectRow({ context: newVoiceState, games: message.games })

					const buttonRow = SearchCommand.createButtonRow({ context: newVoiceState }, gameInfos[0])

					const embedMessage = ComponentSearchPartnerMessageUtils.createOrUpdate({
						authorUsername: getDiscordUsername(author),
						authorPicture: author?.user.avatarURL() || undefined,
						members: message.members,
						lateMembers: message.lateMembers,
						games: message.games,
						voiceChannelName: newVoiceState.channel?.name,
						voiceChannelId: newVoiceState.channel?.id,
						bgImgs: message.bgImgs,
						locale: newVoiceState.guild.preferredLocale ?? 'en',
						additionalInformations: message.additionalInformations,
					}).addActionRowComponents(selectRow, buttonRow)

					try {
						const discordMessage = await botChannel.messages.fetch(message.messageId)

						await discordMessage.edit({
							components: [discordMessage.components[0], embedMessage],
							flags: MessageFlags.IsComponentsV2,
						})
					} catch (e) {
						await this.messageProvider.deleteMessage({ msgId: message.messageId })
					}
				}
			}
		})
	}
}
