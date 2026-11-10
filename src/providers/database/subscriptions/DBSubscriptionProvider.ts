import { Collection, Db, ObjectId } from 'mongodb'
import pino from 'pino'
import { GameSubscription, SubscribableGame } from '../../../domain/models/subscriptions/GameSubscription'

export default class DBSubscriptionProvider {
	private readonly dbRef: Collection<GameSubscription>
	private readonly logger = pino({ level: 'info', name: 'DBSubscriptionProvider' })

	constructor(p: { db: Db }) {
		this.dbRef = p.db.collection<GameSubscription>('subscriptions')

		this.dbRef
			.createIndex({ guildId: 1, userId: 1, gameKey: 1 }, { unique: true })
			.catch((err) => this.logger.error({ err }, 'Could not create the subscriptions index'))
	}

	async getActiveSubscriptions(p: {
		guildId: string
		userId: string
		gameKeys: string[]
	}): Promise<GameSubscription[]> {
		return this.dbRef
			.find({ guildId: p.guildId, userId: p.userId, gameKey: { $in: p.gameKeys }, active: true })
			.toArray()
	}

	async getSubscribers(p: {
		guildId: string
		gameKeys: string[]
		excludedUserId: string
	}): Promise<GameSubscription[]> {
		return this.dbRef
			.find({ guildId: p.guildId, gameKey: { $in: p.gameKeys }, active: true, userId: { $ne: p.excludedUserId } })
			.toArray()
	}

	/** Creates the subscription, or reactivates the earlier one for the same game */
	async activate(p: {
		guildId: string
		userId: string
		game: SubscribableGame
		locale: string
	}): Promise<GameSubscription> {
		const result = await this.dbRef.findOneAndUpdate(
			{ guildId: p.guildId, userId: p.userId, gameKey: p.game.key },
			{
				$set: { active: true, gameName: p.game.name, locale: p.locale },
				$setOnInsert: { createdAt: new Date() },
			},
			{ upsert: true, returnDocument: 'after' }
		)
		return result.value as GameSubscription
	}

	async deactivate(p: { ids: ObjectId[] }): Promise<void> {
		await this.dbRef.updateMany({ _id: { $in: p.ids } }, { $set: { active: false } })
	}

	/** Scoped to the user, so a button can only ever unsubscribe the member who clicks it */
	async deactivateForUser(p: { id: ObjectId; userId: string }): Promise<GameSubscription | null> {
		const result = await this.dbRef.findOneAndUpdate(
			{ _id: p.id, userId: p.userId },
			{ $set: { active: false } },
			{ returnDocument: 'after' }
		)
		return result.value
	}
}
