import { Game } from '../../../domain/models/games/Game'
import { gameAbbreviation } from './GameAbbreviation'

export class VideoGameProvider {
	baseURL = 'https://api.rawg.io/api'

	async searchGames(p: { searchInput: string }): Promise<Game[]> {
		const searchInput = gameAbbreviation.get(p.searchInput.toLowerCase()) ?? p.searchInput

		try {
			const response = await fetch(
				`${this.baseURL}/games?search=${searchInput}&platforms=4&page_size=5&key=${process.env.RAWG_API_KEY}`
			)

			if (!response.ok) {
				console.error(response)
				return [{ name: p.searchInput, background_image: `https://http.cat/${response.status}`, slug: 'unknown' }]
			}

			return (<{ results: Game[] }>await response.json()).results
		} catch (e) {
			console.error(e)
			return [{ name: p.searchInput, background_image: `https://http.cat/404`, slug: 'unknown' }]
		}
	}
}
