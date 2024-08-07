import { CronJob } from 'cron'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import { DateTime } from 'luxon'
import { Job } from './Job'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, TextBasedChannel } from 'discord.js'
import EmbedSearchPartnerMessageUtils from '../../utils/EmbedSearchPartnerMessageUtils'
import pino from 'pino'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'
import i18next from 'i18next'

export class ExpirationJob extends Job {
	protected job: CronJob
	private readonly messageProvider: DBMessageProvider
	private readonly client: Client
	private readonly logger = pino({ level: 'info', name: 'ExpirationJob' })

	constructor(p: { messageProvider: DBMessageProvider; discordClient: Client }) {
		super()
		this.messageProvider = p.messageProvider
		this.client = p.discordClient

		this.job = new CronJob('0 * * * * *', this.handler.bind(this))

	}

	private async handler() {
		const messages = await this.messageProvider.getUnexpiredMessagesBetweenDate({
			start: DateTime.now().minus({ minutes: 2 }).toJSDate(),
			end: DateTime.now().toJSDate(),
		})

		await Promise.all(
			messages
				.filter((message) => !message.expired)
				.map(async (message) => {
					const discordChannel = <TextBasedChannel>await this.client.channels.fetch(message.channelId, { cache: false })

					const discordMessage = await discordChannel?.messages.fetch({
						message: message.messageId,
						cache: false,
					})

					const author = await discordMessage.guild?.members.fetch(message.authorId)

					const embedMessage = await EmbedSearchPartnerMessageUtils.createOrUpdate({
						authorUsername: getDiscordUsername(author),
						authorPicture: author?.user.avatarURL() || undefined,
						members: message.members,
						lateMembers: message.lateMembers,
						games: message.games,
						locale: discordMessage.guild?.preferredLocale ?? 'en',
						additionalInformations: message.additionalInformations,
						expired: true,
					})

					const rebootButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId('reboot')
							.setLabel(i18next.t('actions.reboot', { lng: discordMessage.guild?.preferredLocale ?? 'en' }))
							.setStyle(ButtonStyle.Primary)
					)

					return Promise.all([
						this.messageProvider.setMessageExpired({ msgId: message.messageId, expired: true }),
						discordMessage.edit({
							embeds: [embedMessage],
							components: [rebootButton],
						}),
						(async (): Promise<void> => this.logger.info(discordMessage, 'Set as expired'))(),
					])
				})
		)
	}
}
