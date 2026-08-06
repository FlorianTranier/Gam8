import { Game } from '../../../domain/models/games/Game'
import { gameAbbreviation } from './GameAbbreviation'
import pino from 'pino'

const PC_PLATFORM_ID = 6
const MAIN_GAME_CATEGORY = 0

export class VideoGameProvider {
	baseURL = 'https://api.igdb.com/v4'

	private readonly logger = pino({ level: 'info', name: 'VideoGameProvider' })

	private token?: { value: string; expiresAt: number }

	private async getToken(): Promise<string> {
		if (this.token && Date.now() < this.token.expiresAt) return this.token.value

		this.logger.info('Requesting a new Twitch access token')

		const response = await fetch(
			`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}` +
				`&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
			{ method: 'POST' }
		)

		if (!response.ok) {
			this.logger.error({ status: response.status }, 'Twitch token request failed')
			throw new Error(`Twitch token request failed with status ${response.status}`)
		}

		const token = <{ access_token: string; expires_in: number }>await response.json()

		// Refresh 5 minutes early to avoid racing the expiry
		this.token = { value: token.access_token, expiresAt: Date.now() + (token.expires_in - 300) * 1000 }

		this.logger.info({ expiresIn: token.expires_in }, 'Twitch access token refreshed')

		return this.token.value
	}

	async searchGames(p: { searchInput: string }): Promise<Game[]> {
		const searchInput = gameAbbreviation.get(p.searchInput.toLowerCase()) ?? p.searchInput

		this.logger.info({ input: p.searchInput, searchInput }, 'Searching games on IGDB')

		const startedAt = Date.now()

		try {
			const response = await fetch(`${this.baseURL}/games`, {
				method: 'POST',
				headers: {
					'Client-ID': process.env.TWITCH_CLIENT_ID ?? '',
					Authorization: `Bearer ${await this.getToken()}`
				},
				body:
					`search "${searchInput.replace(/"/g, '')}"; ` +
					`fields name,slug,cover.image_id; ` +
					`where platforms = (${PC_PLATFORM_ID}) & game_type = ${MAIN_GAME_CATEGORY}; ` +
					`limit 5;`
			})

			if (!response.ok) {
				this.logger.error(
					{ searchInput, status: response.status, body: await response.text(), durationMs: Date.now() - startedAt },
					'IGDB search failed'
				)
				return [{ name: p.searchInput, background_image: `https://http.cat/${response.status}`, slug: 'unknown' }]
			}

			const games = <{ name: string; slug: string; cover?: { image_id: string } }[]>await response.json()

			this.logger.info(
				{ searchInput, count: games.length, durationMs: Date.now() - startedAt },
				'IGDB search succeeded'
			)

			if (games.length === 0) this.logger.warn({ searchInput }, 'IGDB returned no game for this search')

			return games.map(game => ({
				name: game.name,
				slug: game.slug,
				background_image: game.cover
					? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
					: 'https://http.cat/404'
			}))
		} catch (e) {
			this.logger.error({ err: e, searchInput, durationMs: Date.now() - startedAt }, 'IGDB search threw')
			return [{ name: p.searchInput, background_image: `https://http.cat/404`, slug: 'unknown' }]
		}
	}
}
