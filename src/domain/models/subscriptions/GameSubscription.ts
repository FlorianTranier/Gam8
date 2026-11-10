import { ObjectId } from 'mongodb'
import { Game } from '../games/Game'

/** A member who wants a DM whenever someone searches players for a game on a server */
export interface GameSubscription {
	_id: ObjectId
	guildId: string
	userId: string
	/** IGDB slug, or "input:<name>" for a game IGDB does not know */
	gameKey: string
	gameName: string
	/** The subscriber's Discord locale, used for the notification DMs */
	locale: string
	/**
	 * Unsubscribing deactivates rather than deletes, so a later subscription to the same game
	 * reuses this document and the unsubscribe buttons of older DMs keep working.
	 */
	active: boolean
	createdAt: Date
}

export interface SubscribableGame {
	key: string
	name: string
}

/**
 * Maps the games typed in a search to what subscriptions are keyed on. Several inputs can resolve
 * to the same IGDB game ("lol" and "League of Legends"), so duplicates are dropped.
 */
export const toSubscribableGames = (inputs: string[], infos: Partial<Game>[]): SubscribableGame[] => {
	const games = inputs.map((input, i) => {
		const info = infos[i]
		return info?.slug && info.slug !== 'unknown'
			? { key: info.slug, name: info.name ?? input }
			: { key: `input:${input.trim().toLowerCase().replace(/\s+/g, ' ')}`, name: input }
	})
	return games.filter((game, i) => games.findIndex((other) => other.key === game.key) === i)
}
