import { Client, Events } from 'discord.js'
import SelectReactionService from '../domain/services/selectReactions/SelectReactionService'
import pino from 'pino'
import GameSubscriptionService from '../domain/services/subscriptions/GameSubscriptionService'

export default class ReactionRouter {
	private readonly client: Client

	private readonly selectReactionService: SelectReactionService
	private readonly subscriptionService: GameSubscriptionService
	private readonly logger = pino({ level: 'info', name: 'VoiceStateListener' })

	constructor(p: {
		client: Client
		selectReactionService: SelectReactionService
		subscriptionService: GameSubscriptionService
	}) {
		this.client = p.client
		this.selectReactionService = p.selectReactionService
		this.subscriptionService = p.subscriptionService

		this.createEventReaction()
			.then(() => this.logger.info(`${ReactionRouter.name} OK`))
			.catch(() => this.logger.error(`${ReactionRouter.name} NOK`))
	}

	private async createEventReaction(): Promise<void> {
		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isStringSelectMenu()) return

			if (GameSubscriptionService.isSubscriptionInteraction(interaction.customId)) {
				await this.subscriptionService.handleSubscribeSelect({ interaction })
				return
			}

			if (interaction.member?.user.id !== interaction?.message?.author?.id) {
				await this.selectReactionService.handleSelectedValues({ interaction: interaction })
			}
		})

		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isButton()) return

			// Checked first: unsubscribe buttons live in DMs, where there is no search message to load
			if (GameSubscriptionService.isSubscriptionInteraction(interaction.customId)) {
				await this.subscriptionService.handleButton({ interaction })
				return
			}

			await this.selectReactionService.handleButtons({ interaction: interaction })
		})
	}
}
