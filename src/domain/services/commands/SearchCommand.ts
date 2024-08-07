import {
	ActionRowBuilder,
	BaseInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	GuildMember,
	MessageActionRowComponentBuilder,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
} from 'discord.js'
import MessageType from '../../models/messages/enums/MessageType'
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import CommandInterface from './CommandInterface'
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils'
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider'
import { VideoGameProvider } from '../../../providers/rawg/games/VideoGameProvider'
import i18next from 'i18next'
import { gameAbbreviation } from '../../../providers/rawg/games/GameAbbreviation'
import pino from 'pino'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'
import { Game } from '../../models/games/Game'
import { ImageProvider } from '../../../providers/s3/ImageProvider'
import { mergeImages } from '../../utils/ImageUtils'

export default class SearchCommand implements CommandInterface {
	COMMAND = 'search'

	private readonly messageProvider: DBMessageProvider
	private readonly channelProvider: DBChannelProvider
	private readonly videoGameProvider: VideoGameProvider
	private readonly imageProvider: ImageProvider
	private readonly logger = pino({ level: 'info', name: 'SearchCommand' })

	constructor(p: {
		messageProvider: DBMessageProvider
		channelProvider: DBChannelProvider
		videoGameProvider: VideoGameProvider
		imageProvider: ImageProvider
	}) {
		this.messageProvider = p.messageProvider
		this.channelProvider = p.channelProvider
		this.videoGameProvider = p.videoGameProvider
		this.imageProvider = p.imageProvider
	}

	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return new SlashCommandBuilder()
			.setDescription(i18next.t('commands.search.description', { lng: 'en' }))
			.setName(this.COMMAND)
			.setDescriptionLocalizations({
				fr: i18next.t('commands.search.description', { lng: 'fr' })
			})
			.addStringOption((option) =>
				option
					.setName('game')
					.setDescription(i18next.t('commands.search.game_option', { lng: 'en' }))
					.setDescriptionLocalizations({
						fr: i18next.t('commands.search.game_option', { lng: 'fr' })
					})
					.setRequired(true)
					.setMaxLength(255)
					.setAutocomplete(true)
			)
			.addStringOption((option) =>
				option
					.setName('game2')
					.setDescription(i18next.t('commands.search.game_option', { lng: 'en' }))
					.setDescriptionLocalizations({
						fr: i18next.t('commands.search.game_option', { lng: 'fr' })
					})
					.setRequired(false)
					.setMaxLength(255)
					.setAutocomplete(true)
			)
			.addStringOption((option) =>
				option
					.setName('game3')
					.setDescription(i18next.t('commands.search.game_option', { lng: 'en' }))
					.setDescriptionLocalizations({
						fr: i18next.t('commands.search.game_option', { lng: 'fr' })
					})
					.setRequired(false)
					.setMaxLength(255)
					.setAutocomplete(true)
			)
			.addStringOption((option) =>
				option
					.setName('game4')
					.setDescription(i18next.t('commands.search.game_option', { lng: 'en' }))
					.setDescriptionLocalizations({
						fr: i18next.t('commands.search.game_option', { lng: 'fr' })
					})
					.setRequired(false)
					.setMaxLength(255)
					.setAutocomplete(true)
			)
			.addStringOption((option) =>
				option
					.setName('additional_informations')
					.setDescription(i18next.t('commands.search.additional_informations', { lng: 'en' }))
					.setDescriptionLocalizations({
						fr: i18next.t('commands.search.additional_informations', { lng: 'fr' })
					})
					.setRequired(false)
					.setMaxLength(255)
			)
			.setDMPermission(false)
			.toJSON()
	}

	async supportCommand(p: { command: string }): Promise<boolean> {
		return p.command == this.COMMAND
	}

	async exec(p: { context: ChatInputCommandInteraction }): Promise<void> {
		const association = await this.channelProvider.getByGuildId({ guildId: p.context.guild?.id ?? '' })

		const tag = association?.tagRoleId ? `<@&${association.tagRoleId}>` : ''

		await p.context.reply({
			content: tag,
			allowedMentions: { roles: [association?.tagRoleId ?? ''] },
		})

		const games = [
			this.getGame({ ...p, fieldKey: 'game' }),
			this.getGame({ ...p, fieldKey: 'game2' }),
			this.getGame({ ...p, fieldKey: 'game3' }),
			this.getGame({ ...p, fieldKey: 'game4' }),
		].filter((game) => game !== undefined) as string[]

		const additionalInformations = p.context.options.getString('additional_informations')

		const gameInfos = await Promise.all(games.map((game) => SearchCommand.getGameInfos(game, this.videoGameProvider)))

		let backgroundImage

		if (gameInfos.length > 1) {
			const backgroundImageFileName = gameInfos.map((gameInfo) => gameInfo.slug).join('_') + '.png'

			if (await this.imageProvider.fileExists(backgroundImageFileName)) {
				backgroundImage = await this.imageProvider.getPresignedUrl(backgroundImageFileName)
			} else {
				const image = await mergeImages(
					gameInfos[0].background_image,
					gameInfos[1].background_image,
					gameInfos[2]?.background_image,
					gameInfos[3]?.background_image
				)

				backgroundImage = await this.imageProvider.uploadFile(image, backgroundImageFileName)
			}
		}

		const author = await p.context.guild?.members.fetch(p.context.member?.user.id ?? '')

		const selectRow = SearchCommand.createSelectRow({ ...p, games: games })

		const buttonRow = SearchCommand.createButtonRow(p, gameInfos[0])

		const message = await p.context.editReply({
			content: tag,
			embeds: [
				await EmbedMessageGenerator.createOrUpdate({
					authorUsername: getDiscordUsername(p.context.member as GuildMember),
					authorPicture: author?.user.avatarURL() || '',
					games,
					members: [],
					lateMembers: [],
					voiceChannelName: author?.voice.channel?.name,
					voiceChannelId: author?.voice.channel?.id,
					bgImg: backgroundImage ?? gameInfos[0].background_image,
					locale: p.context.guildLocale ?? 'en',
					additionalInformations: additionalInformations ?? undefined,
				}),
			],
			components: [buttonRow, selectRow],
			allowedMentions: { roles: [association?.tagRoleId ?? ''] },
		})

		const newMessage = new SearchPartnerMessage({
			serverId: p.context.guild?.id || '',
			authorId: p.context.member?.user.id || '',
			messageId: message?.id || '',
			game: games[0],
			games: games,
			type: MessageType.RESEARCH_PARTNER,
			members: [],
			lateMembers: [],
			channelId: p.context.channel?.id || '',
			bgImg: backgroundImage ?? gameInfos[0].background_image,
			additionalInformations: additionalInformations ?? undefined,
		})

		await this.messageProvider.saveMessage({
			message: newMessage,
		})

		this.logger.info(newMessage, 'New Game8 message !')
	}

	private getGame(p: { context: ChatInputCommandInteraction; fieldKey: string }) {
		return (
			gameAbbreviation.get(p.context.options.getString(p.fieldKey) ?? '') ??
			p.context.options.getString(p.fieldKey) ??
			undefined
		)
	}

	public static async getGameInfos(game: string, videoGameProvider: VideoGameProvider) {
		return (
			(await videoGameProvider.searchGames({ searchInput: game }))[0] ?? {
				background_image:
					'https://unsplash.com/photos/sxiSod0tyYQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8MXx8bm90JTIwZm91bmR8ZnJ8MHx8fHwxNjc1NDI0OTMz&force=true&w=1920',
			}
		)
	}

	public static createSelectRow(p: { context: BaseInteraction, games: string[] }) {
		const gameOptions = p.games.map(game => {
			return {
				label: i18next.t('actions.lets_go', { lng: p.context.guildLocale ?? 'en', game: game }),
				value: game,
			}
		})

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('select')
			.setPlaceholder(i18next.t('actions.placeholder', { lng: p.context.guildLocale ?? 'en' }))
			.setMinValues(1)
			.setMaxValues(p.games.length)
			.addOptions(
				...gameOptions,
				{
					label: i18next.t('actions.join_later', { lng: p.context.guildLocale ?? 'en' }),
					value: 'join_later',
				},
				{
					label: i18next.t('actions.no', { lng: p.context.guildLocale ?? 'en' }),
					value: 'no',
				}
			)

		return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			selectMenu
		)
	}

	public static createButtonRow(p: { context: BaseInteraction }, gameInfos: Game) {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('notify')
				.setLabel(i18next.t('actions.notify_me', { lng: p.context.guildLocale ?? 'en' }))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('dont_notify')
				.setLabel(i18next.t('actions.disable_notification', { lng: p.context.guildLocale ?? 'en' }))
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setLabel('?').setStyle(ButtonStyle.Link).setURL(`https://rawg.io/games/${gameInfos.slug}`)
		)
	}
}
