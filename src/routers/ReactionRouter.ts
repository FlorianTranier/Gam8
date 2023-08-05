import { Client, Events } from 'discord.js'
import SelectReactionService from '../domain/services/selectReactions/SelectReactionService'
import pino from 'pino'

export default class ReactionRouter {
	private readonly client: Client

	private readonly selectReactionService: SelectReactionService
	private readonly logger = pino({ level: 'info', name: 'VoiceStateListener' })

	constructor(p: { client: Client; selectReactionService: SelectReactionService }) {
		this.client = p.client
		this.selectReactionService = p.selectReactionService

		this.createEventReaction()
			.then(() => this.logger.info(`${ReactionRouter.name} OK`))
			.catch(() => this.logger.error(`${ReactionRouter.name} NOK`))
	}

	private async createEventReaction(): Promise<void> {
		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isStringSelectMenu()) return

			if (interaction.member?.user.id !== interaction?.message?.author?.id) {
				await this.selectReactionService.handleSelectedValues({ interaction: interaction })
			}
		})

		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isButton()) return

			await this.selectReactionService.handleButtons({ interaction: interaction })
		})
	}
}
