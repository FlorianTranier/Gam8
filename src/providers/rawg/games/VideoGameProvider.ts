import axios, { AxiosInstance } from 'axios'
import { Game } from '../../../domain/models/games/Game'

export class VideoGameProvider {
  client: AxiosInstance
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.rawg.io/api/',
    })
  }

  async searchGames(p: { searchInput: string }): Promise<Game[]> {
    return (
      await this.client.get('games', {
        params: {
          search: p.searchInput,
          platforms: 4,
          page_size: 5,
          key: process.env.RAWG_API_KEY,
        },
      })
    ).data.results as Game[]
  }
}
