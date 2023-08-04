import axios, { AxiosInstance } from 'axios'
import { Game } from '../../../domain/models/games/Game'
import { gameAbbreviation } from './GameAbbreviation'

export class VideoGameProvider {
	client: AxiosInstance
	constructor() {
		this.client = axios.create({
			baseURL: 'https://api.rawg.io/api/',
		})
	}

	async searchGames(p: { searchInput: string }): Promise<Game[]> {
		const searchInput = gameAbbreviation.get(p.searchInput.toLowerCase()) ?? p.searchInput

		return (
			await this.client.get('games', {
				params: {
					search: searchInput,
					platforms: 4,
					page_size: 5,
					key: process.env.RAWG_API_KEY,
				},
			})
		).data.results as Game[]
	}
}
