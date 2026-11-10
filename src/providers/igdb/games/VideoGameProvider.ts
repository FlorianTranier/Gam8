import { Game } from '../../../domain/models/games/Game'
import { gameAbbreviation } from './GameAbbreviation'
import pino from 'pino'

const PC_PLATFORM_ID = 6

// Main game, standalone expansion, remake, remaster, expanded game, port, fork.
// Ports matter: IGDB files "Minecraft" itself as a port of the Java edition.
const PLAYABLE_GAME_TYPES = [0, 4, 8, 9, 10, 11, 12]

const IMAGE_BASE_URL = 'https://images.igdb.com/igdb/image/upload'

// Artwork types usable as a banner, best first: key art with logo (it names the game), key art
// without logo, plain artwork, concept art, historical artwork. Logos, covers, icons and
// infographics are left out: cropped to 16:9 they show a cut-off logo or a sliver of a poster.
const BANNER_ARTWORK_TYPES = [3, 2, 1, 4, 15]
const PLAIN_ARTWORK_TYPE = 1

const RESULT_LIMIT = 5
const CANDIDATE_LIMIT = 30

// How many trailing words may be dropped when a search finds nothing ("lol aram" -> "lol")
const MAX_DROPPED_WORDS = 2

// Search results are re-requested on every reaction, so keep them around for a while
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

// IGDB allows 4 requests per second
const MIN_REQUEST_INTERVAL_MS = 250

type IgdbGame = {
	name: string
	slug: string
	cover?: { image_id: string }
	artworks?: { image_id: string; width: number; height: number; artwork_type?: number }[]
	screenshots?: { image_id: string }[]
	platforms?: number[]
	total_rating_count?: number
}

class IgdbHttpError extends Error {
	constructor(readonly status: number) {
		super(`IGDB search failed with status ${status}`)
	}
}

const normalize = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()

export class VideoGameProvider {
	baseURL = 'https://api.igdb.com/v4'

	private readonly logger = pino({ level: 'info', name: 'VideoGameProvider' })

	private token?: { value: string; expiresAt: number }

	private readonly cache = new Map<string, { games: Game[]; expiresAt: number }>()

	private nextRequestAt = 0

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
		const cacheKey = normalize(p.searchInput)
		const cached = this.cache.get(cacheKey)
		if (cached && Date.now() < cached.expiresAt) return cached.games

		this.logger.info({ input: p.searchInput }, 'Searching games on IGDB')

		const startedAt = Date.now()

		try {
			const games = await this.searchWithFallbacks(p.searchInput)

			this.logger.info(
				{ input: p.searchInput, count: games.length, durationMs: Date.now() - startedAt },
				'IGDB search succeeded'
			)

			this.cache.delete(cacheKey)
			this.cache.set(cacheKey, { games, expiresAt: Date.now() + CACHE_TTL_MS })
			if (this.cache.size > CACHE_MAX_ENTRIES) this.cache.delete(this.cache.keys().next().value as string)

			return games
		} catch (e) {
			const status = e instanceof IgdbHttpError ? e.status : 404
			this.logger.error({ err: e, input: p.searchInput, durationMs: Date.now() - startedAt }, 'IGDB search threw')
			return [{ name: p.searchInput, background_image: `https://http.cat/${status}`, slug: 'unknown' }]
		}
	}

	/**
	 * Tries, in order, until one step finds a game:
	 * 1. a full-text search on the whole input;
	 * 2. a name-prefix match, for partial input typed in autocomplete ("valo" -> Valorant);
	 * 3. the input with its trailing words dropped, for free-form input ("lol aram" -> League of
	 *    Legends, "rocket league ranked" -> Rocket League). Only an exact name match is accepted
	 *    there, otherwise "atelier creatif" would resolve to "Atelier Lulua".
	 */
	private async searchWithFallbacks(input: string): Promise<Game[]> {
		const words = input.trim().split(/\s+/)
		const fullTerm = gameAbbreviation.get(input.trim().toLowerCase()) ?? input.trim()

		let games = VideoGameProvider.rank(await this.queryIgdb({ search: fullTerm }), fullTerm)

		if (games.length === 0) games = VideoGameProvider.rank(await this.queryIgdb({ namePrefix: fullTerm }), fullTerm)

		const shortest = Math.max(1, words.length - MAX_DROPPED_WORDS)
		for (let n = words.length - 1; games.length === 0 && n >= shortest; n--) {
			const term = words.slice(0, n).join(' ')
			const searchTerm = gameAbbreviation.get(term.toLowerCase()) ?? term

			games = VideoGameProvider.rank(await this.queryIgdb({ search: searchTerm }), searchTerm).filter((game) =>
				VideoGameProvider.isExactMatch(game.name, searchTerm)
			)

			if (games.length > 0) this.logger.info({ input, searchTerm }, 'IGDB search matched on a shorter input')
		}

		if (games.length === 0) this.logger.warn({ input }, 'IGDB returned no game for this search')

		// IGDB lists ports under the same name ("Among Us" x3): keep the best ranked one
		const seen = new Set<string>()
		return games
			.filter((game) => !seen.has(normalize(game.name)) && seen.add(normalize(game.name)))
			.slice(0, RESULT_LIMIT)
			.map((game) => ({
				name: game.name,
				slug: game.slug,
				background_image: VideoGameProvider.bannerUrl(game),
			}))
	}

	/**
	 * Landscape banner for the search message: the best usable artwork (by type, then the closest
	 * to 16:9), else a screenshot, else the portrait cover.
	 * t_screenshot_big crops to 889x500, so every banner gets the same 16:9 shape.
	 */
	private static bannerUrl(game: IgdbGame): string {
		// Older artworks have no type: rank them as plain artwork
		const typeRank = (a: { artwork_type?: number }) =>
			BANNER_ARTWORK_TYPES.indexOf(a.artwork_type ?? PLAIN_ARTWORK_TYPE)
		const offRatio = (a: { width: number; height: number }) => Math.abs(a.width / a.height - 16 / 9)

		const artwork = game.artworks
			?.filter((a) => typeRank(a) !== -1 && a.width >= 889 && a.width / a.height >= 1.3)
			.sort((a, b) => typeRank(a) - typeRank(b) || offRatio(a) - offRatio(b))[0]

		const image = artwork ?? game.screenshots?.[0]
		if (image) return `${IMAGE_BASE_URL}/t_screenshot_big/${image.image_id}.jpg`
		return game.cover ? `${IMAGE_BASE_URL}/t_720p/${game.cover.image_id}.jpg` : 'https://http.cat/404'
	}

	private async queryIgdb(q: { search: string } | { namePrefix: string }): Promise<IgdbGame[]> {
		await this.throttle()

		const filter = `game_type = (${PLAYABLE_GAME_TYPES.join(',')})`
		const query =
			'search' in q
				? `search "${q.search.replace(/"/g, '')}"; where ${filter};`
				: `where name ~ "${q.namePrefix.replace(/"/g, '')}"* & ${filter}; sort total_rating_count desc;`

		const response = await fetch(`${this.baseURL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': process.env.TWITCH_CLIENT_ID ?? '',
				Authorization: `Bearer ${await this.getToken()}`,
			},
			body: `fields name,slug,platforms,total_rating_count,cover.image_id,` +
				`artworks.image_id,artworks.width,artworks.height,artworks.artwork_type,screenshots.image_id; ${query} limit ${CANDIDATE_LIMIT};`,
		})

		if (!response.ok) {
			this.logger.error({ query: q, status: response.status, body: await response.text() }, 'IGDB search failed')
			throw new IgdbHttpError(response.status)
		}

		return <IgdbGame[]>await response.json()
	}

	/** Spaces request starts so parallel searches (up to 4 games per command) stay under the rate limit */
	private async throttle(): Promise<void> {
		const now = Date.now()
		const startAt = Math.max(now, this.nextRequestAt)
		this.nextRequestAt = startAt + MIN_REQUEST_INTERVAL_MS
		if (startAt > now) await new Promise((resolve) => setTimeout(resolve, startAt - now))
	}

	/**
	 * IGDB's own relevance order is poor ("Valorant" ranks "Grit & Valor: 1949" first), so
	 * candidates are re-ranked: exact name, then name prefix, then all words present, with
	 * popularity, PC availability and having a cover as tie-breakers.
	 */
	private static isExactMatch(name: string, query: string): boolean {
		return normalize(name).replace(/ /g, '') === normalize(query).replace(/ /g, '')
	}

	private static rank(games: IgdbGame[], query: string): IgdbGame[] {
		const q = normalize(query)
		const queryWords = q.split(' ')

		const score = (game: IgdbGame) => {
			const name = normalize(game.name)
			let s = 0
			if (VideoGameProvider.isExactMatch(game.name, query)) s += 1000
			else if (name.startsWith(q)) s += 100
			else if (queryWords.every((w) => name.includes(w))) s += 50
			if (game.platforms?.includes(PC_PLATFORM_ID)) s += 30
			if (game.cover) s += 10
			s += Math.log10((game.total_rating_count ?? 0) + 1) * 20
			return s
		}

		return games
			.map((game, index) => ({ game, index, score: score(game) }))
			.sort((a, b) => b.score - a.score || a.index - b.index)
			.map(({ game }) => game)
	}
}
