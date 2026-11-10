import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonComponent,
	ButtonInteraction,
	ButtonStyle,
	ComponentType,
	Guild,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from 'discord.js'
import i18next from 'i18next'
import { ObjectId } from 'mongodb'
import pino from 'pino'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import DBSubscriptionProvider from '../../../providers/database/subscriptions/DBSubscriptionProvider'
import { VideoGameProvider } from '../../../providers/igdb/games/VideoGameProvider'
import { GameSubscription, SubscribableGame, toSubscribableGames } from '../../models/subscriptions/GameSubscription'

// This i18next version types t() as possibly null
const t = (key: string, options: Record<string, unknown>): string => i18next.t(key, options) ?? ''

const formatGames = (names: string[]) => names.map((name) => `**${name}**`).join(', ')

// Discord caps button labels at 80 characters
const buttonLabel = (label: string) => (label.length > 80 ? `${label.slice(0, 79)}…` : label)

export default class GameSubscriptionService {
	/** "Follow this game" button on search messages */
	static readonly SUBSCRIBE_ID = 'subscribe'
	/** Game picker shown when a search has several games; followed by the search message id */
	static readonly SUBSCRIBE_SELECT_PREFIX = 'subscribe_select:'
	/** Unsubscribe buttons in DMs; followed by the subscription id */
	static readonly UNSUBSCRIBE_PREFIX = 'unsubscribe:'

	private readonly subscriptionProvider: DBSubscriptionProvider
	private readonly messageProvider: DBMessageProvider
	private readonly videoGameProvider: VideoGameProvider
	private readonly logger = pino({ level: 'info', name: 'GameSubscriptionService' })

	constructor(p: {
		subscriptionProvider: DBSubscriptionProvider
		messageProvider: DBMessageProvider
		videoGameProvider: VideoGameProvider
	}) {
		this.subscriptionProvider = p.subscriptionProvider
		this.messageProvider = p.messageProvider
		this.videoGameProvider = p.videoGameProvider
	}

	static isSubscriptionInteraction(customId: string): boolean {
		return (
			customId === GameSubscriptionService.SUBSCRIBE_ID ||
			customId.startsWith(GameSubscriptionService.SUBSCRIBE_SELECT_PREFIX) ||
			customId.startsWith(GameSubscriptionService.UNSUBSCRIBE_PREFIX)
		)
	}

	async handleButton(p: { interaction: ButtonInteraction }): Promise<void> {
		if (p.interaction.customId.startsWith(GameSubscriptionService.UNSUBSCRIBE_PREFIX))
			return this.handleUnsubscribeButton(p)
		return this.handleSubscribeButton(p)
	}

	/** Subscribes right away to a single-game search, or asks which games of a multi-game search */
	private async handleSubscribeButton(p: { interaction: ButtonInteraction }): Promise<void> {
		const { interaction } = p
		await interaction.deferReply({ flags: MessageFlags.Ephemeral })

		const message = await this.messageProvider.getMessageByMessageId({ msgId: interaction.message.id })
		if (!message || !interaction.guild) {
			await interaction.deleteReply()
			return
		}

		const games = await this.resolveGames(message.games)

		if (games.length === 1) {
			await interaction.editReply({ content: await this.subscribe({ interaction, guild: interaction.guild, games }) })
			return
		}

		const lng = interaction.locale
		const followed = await this.subscriptionProvider.getActiveSubscriptions({
			guildId: interaction.guild.id,
			userId: interaction.user.id,
			gameKeys: games.map((game) => game.key),
		})

		const picker = new StringSelectMenuBuilder()
			.setCustomId(`${GameSubscriptionService.SUBSCRIBE_SELECT_PREFIX}${interaction.message.id}`)
			.setPlaceholder(t('subscription.choose_games', { lng }))
			.setMinValues(1)
			.setMaxValues(games.length)
			.addOptions(
				games.map((game, i) => ({
					label: game.name.slice(0, 100),
					// Indexes rather than game keys, which can exceed the 100 characters Discord allows
					value: String(i),
					description: followed.some((sub) => sub.gameKey === game.key)
						? t('subscription.already_followed', { lng })
						: undefined,
				}))
			)

		await interaction.editReply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(picker)] })
	}

	async handleSubscribeSelect(p: { interaction: StringSelectMenuInteraction }): Promise<void> {
		const { interaction } = p
		await interaction.deferUpdate()

		const messageId = interaction.customId.slice(GameSubscriptionService.SUBSCRIBE_SELECT_PREFIX.length)
		const message = await this.messageProvider.getMessageByMessageId({ msgId: messageId })
		if (!message || !interaction.guild) return

		const games = (await this.resolveGames(message.games)).filter((_, i) => interaction.values.includes(String(i)))

		await interaction.editReply({
			content: await this.subscribe({ interaction, guild: interaction.guild, games }),
			components: [],
		})
	}

	/**
	 * Subscribes to the games not followed yet and explains how it works in a DM. Without DMs a
	 * subscription is useless, so it is rolled back when the DM cannot be delivered.
	 * Returns the ephemeral answer to show.
	 */
	private async subscribe(p: {
		interaction: ButtonInteraction | StringSelectMenuInteraction
		guild: Guild
		games: SubscribableGame[]
	}): Promise<string> {
		const { interaction, guild, games } = p
		const lng = interaction.locale

		const followed = await this.subscriptionProvider.getActiveSubscriptions({
			guildId: guild.id,
			userId: interaction.user.id,
			gameKeys: games.map((game) => game.key),
		})
		const newGames = games.filter((game) => !followed.some((sub) => sub.gameKey === game.key))

		if (newGames.length === 0)
			return t('subscription.response_already', { lng, games: formatGames(games.map((game) => game.name)) })

		const subscriptions = await Promise.all(
			newGames.map((game) =>
				this.subscriptionProvider.activate({ guildId: guild.id, userId: interaction.user.id, game, locale: lng })
			)
		)

		try {
			await interaction.user.send({
				content: t('subscription.dm_subscribed', {
					lng,
					games: formatGames(newGames.map((game) => game.name)),
					guild: guild.name,
				}),
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(this.unsubscribeButtons(subscriptions, lng))],
			})
		} catch (err) {
			await this.subscriptionProvider.deactivate({ ids: subscriptions.map((sub) => sub._id) })
			this.logger.warn({ err, userId: interaction.user.id }, 'Subscription DM failed, subscription rolled back')
			return t('subscription.response_dm_closed', { lng })
		}

		this.logger.info(
			{ guildId: guild.id, userId: interaction.user.id, games: newGames.map((game) => game.key) },
			'New game subscription'
		)

		return t('subscription.response_subscribed', { lng })
	}

	/** Unsubscribe button of a DM: deactivates the subscription and turns the button into a confirmation */
	private async handleUnsubscribeButton(p: { interaction: ButtonInteraction }): Promise<void> {
		const { interaction } = p
		const lng = interaction.locale
		const id = interaction.customId.slice(GameSubscriptionService.UNSUBSCRIBE_PREFIX.length)

		const subscription = ObjectId.isValid(id)
			? await this.subscriptionProvider.deactivateForUser({ id: new ObjectId(id), userId: interaction.user.id })
			: null

		if (subscription)
			this.logger.info(
				{ guildId: subscription.guildId, userId: subscription.userId, game: subscription.gameKey },
				'Game unsubscription'
			)

		const doneLabel = buttonLabel(
			`✓ ${
				subscription
					? t('subscription.unsubscribed', { lng, game: subscription.gameName })
					: t('subscription.unsubscribed_short', { lng })
			}`
		)

		const rows = interaction.message.components.flatMap((row) =>
			row.type === ComponentType.ActionRow
				? [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							row.components
								.filter((component): component is ButtonComponent => component.type === ComponentType.Button)
								.map((component) => {
									const button = ButtonBuilder.from(component)
									return component.customId === interaction.customId
										? button.setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel(doneLabel)
										: button
								})
						),
				  ]
				: []
		)

		await interaction.update({ components: rows })
	}

	/** DMs the subscribers of these games on this server about a new search, one DM per subscriber */
	async notifySubscribers(p: {
		guild: Guild
		authorId: string
		authorName: string
		games: SubscribableGame[]
		messageUrl: string
	}): Promise<void> {
		const subscriptions = await this.subscriptionProvider.getSubscribers({
			guildId: p.guild.id,
			gameKeys: p.games.map((game) => game.key),
			excludedUserId: p.authorId,
		})

		const byUser = new Map<string, GameSubscription[]>()
		subscriptions.forEach((sub) => byUser.set(sub.userId, [...(byUser.get(sub.userId) ?? []), sub]))

		const results = await Promise.allSettled(
			[...byUser.entries()].map(async ([userId, userSubscriptions]) => {
				const lng = userSubscriptions[0].locale
				const user = await p.guild.client.users.fetch(userId)

				await user.send({
					content: t('subscription.dm_new_search', {
						lng,
						author: p.authorName,
						games: formatGames(userSubscriptions.map((sub) => sub.gameName)),
						guild: p.guild.name,
					}),
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setURL(p.messageUrl)
								.setLabel(t('subscription.view_search', { lng })),
							...this.unsubscribeButtons(userSubscriptions, lng)
						),
					],
				})
			})
		)

		const failed = results.filter((result) => result.status === 'rejected')
		failed.forEach((result) =>
			this.logger.warn({ err: (result as PromiseRejectedResult).reason }, 'Subscription notification failed')
		)

		if (byUser.size > 0)
			this.logger.info(
				{ guildId: p.guild.id, notified: byUser.size - failed.length, failed: failed.length },
				'Subscribers notified'
			)
	}

	// A search has at most 4 games, so with the link button a DM stays within Discord's 5 buttons per row
	private unsubscribeButtons(subscriptions: GameSubscription[], lng: string): ButtonBuilder[] {
		return subscriptions.map((sub) =>
			new ButtonBuilder()
				.setCustomId(`${GameSubscriptionService.UNSUBSCRIBE_PREFIX}${sub._id.toHexString()}`)
				.setStyle(ButtonStyle.Secondary)
				.setLabel(buttonLabel(`🔕 ${t('subscription.unsubscribe', { lng, game: sub.gameName })}`))
		)
	}

	private async resolveGames(inputs: string[]): Promise<SubscribableGame[]> {
		const infos = await Promise.all(
			inputs.map(async (input) => (await this.videoGameProvider.searchGames({ searchInput: input }))[0] ?? {})
		)
		return toSubscribableGames(inputs, infos)
	}
}
