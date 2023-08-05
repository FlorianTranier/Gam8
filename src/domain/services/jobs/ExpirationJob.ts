import { CronJob } from 'cron'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import { DateTime } from 'luxon'
import { Job } from './Job'
import { Client, TextBasedChannel } from 'discord.js'
import EmbedSearchPartnerMessageUtils from '../../utils/EmbedSearchPartnerMessageUtils'
import pino from 'pino'

export class ExpirationJob extends Job {
	protected job: CronJob
	private readonly messageProvider: DBMessageProvider
	private readonly client: Client
	private readonly logger = pino({ level: 'info', name: 'ExpirationJob' })

	constructor(p: { messageProvider: DBMessageProvider; discordClient: Client }) {
		super()
		this.messageProvider = p.messageProvider
		this.client = p.discordClient

		this.job = new CronJob('0 0 * * * *', this.handler.bind(this))
	}

	private async handler() {
		const messages = await this.messageProvider.getUnexpiredMessagesBetweenDate({
			start: DateTime.now().minus({ days: 2 }).toJSDate(),
			end: DateTime.now().minus({ hours: 3 }).toJSDate(),
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
						authorUsername: author?.user.username,
						authorPicture: author?.user.avatarURL() || undefined,
						membersId: message.membersId,
						lateMembersId: message.lateMembersId,
						game: message.game,
						locale: discordMessage.guild?.preferredLocale ?? 'en',
						additionalInformations: message.additionalInformations,
						expired: true,
					})

					return Promise.all([
						this.messageProvider.setMessageExpired({ msgId: message.messageId, expired: true }),
						discordMessage.edit({
							embeds: [embedMessage],
							components: [],
						}),
						this.logger.info(discordMessage, 'Set as expired'),
					])
				})
		)
	}
}
