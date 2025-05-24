import { ButtonInteraction, GuildMember, MessageFlags, StringSelectMenuInteraction } from 'discord.js'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage'
import i18next from 'i18next'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider'
import { VideoGameProvider } from '../../../providers/rawg/games/VideoGameProvider'
import SearchCommand from '../commands/SearchCommand'
import ComponentSearchPartnerMessageUtils from '../../utils/ComponentSearchPartnerMessageUtils'

export default class SelectReactionService {
	private readonly messageProvider: DBMessageProvider
	private readonly channelProvider: DBChannelProvider
	private readonly videoGameProvider: VideoGameProvider

	constructor(p: {
		messageProvider: DBMessageProvider
		channelProvider: DBChannelProvider
		videoGameProvider: VideoGameProvider
	}) {
		this.messageProvider = p.messageProvider
		this.channelProvider = p.channelProvider
		this.videoGameProvider = p.videoGameProvider
	}

	async handleButtons(p: { interaction: ButtonInteraction }): Promise<void> {
		await p.interaction.deferReply({ ephemeral: p.interaction.customId !== 'reboot' })

		const message = await this.messageProvider.getMessageByMessageId({ msgId: p.interaction.message.id })
		let updatedMessage = message

		if (p.interaction.customId === 'notify' && !message.notifiedMembersId.includes(p.interaction.user.id)) {
			updatedMessage = await this.addGetNotified({ interaction: p.interaction })
		}

		if (p.interaction.customId === 'dont_notify' && message.notifiedMembersId.includes(p.interaction.user.id)) {
			updatedMessage = await this.removeGetNotified({ interaction: p.interaction })
		}

		if (updatedMessage.notifiedMembersId.includes(p.interaction.user.id)) {
			p.interaction.editReply({
				content: i18next.t('response.notification_validation', { lng: p.interaction.guildLocale ?? 'en' }),
			})
		} else {
			p.interaction.editReply({
				content: i18next.t('response.notification_disabled', { lng: p.interaction.guildLocale ?? 'en' }),
			})
		}

		if (p.interaction.customId === 'reboot') {
			const author = await p.interaction.guild?.members.fetch(p.interaction.member?.user.id ?? '')

			await p.interaction.message.edit({
				content: p.interaction.message.content,
				embeds: p.interaction.message.embeds,
				components: [],
			})

			const association = await this.channelProvider.getByGuildId({ guildId: p.interaction.guild?.id ?? '' })

			const tag = association?.tagRoleId ? `<@&${association.tagRoleId}>` : ''

			const gameInfos = await Promise.all(
				message.games.map((game) => SearchCommand.getGameInfos(game, this.videoGameProvider))
			)

			const selectRow = SearchCommand.createSelectRow({ context: p.interaction, games: message.games })

			const buttonRow = SearchCommand.createButtonRow({ context: p.interaction }, gameInfos[0])

			const newMessage = await p.interaction.editReply({
				content: tag,
				withComponents: true,
				components: [
					ComponentSearchPartnerMessageUtils.createOrUpdate({
						authorUsername: getDiscordUsername(p.interaction.member as GuildMember),
						authorPicture: author?.user.avatarURL() || '',
						games: message.games,
						members: [],
						lateMembers: [],
						voiceChannelName: author?.voice.channel?.name,
						voiceChannelId: author?.voice.channel?.id,
						bgImgs: message.bgImgs,
						locale: p.interaction.guildLocale ?? 'en',
						additionalInformations: undefined,
					}).addActionRowComponents(selectRow, buttonRow),
				],
				flags: MessageFlags.IsComponentsV2,

				allowedMentions: { roles: [association?.tagRoleId ?? ''] },
			})

			await this.messageProvider.cloneMessage({
				msgId: p.interaction.message.id,
				newMsgId: newMessage.id,
				authorId: p.interaction.user.id,
			})
		}
	}

	async handleSelectedValues(p: { interaction: StringSelectMenuInteraction }): Promise<void> {
		await p.interaction.deferReply({ ephemeral: true })

		const selectedValues = p.interaction.values

		const message = await this.messageProvider.getMessageByMessageId({ msgId: p.interaction.message.id })
		let updatedMessage = message

		if (!(selectedValues.includes('join_later') || selectedValues.includes('no'))) {
			if (message.members.map((member) => member.id).includes(p.interaction.user.id))
				this.removeMember({ interaction: p.interaction })
			updatedMessage = await this.addMember({ interaction: p.interaction, games: selectedValues })
			message.notifiedMembersId.forEach(async (memberId) => {
				const member = await p.interaction.message.guild?.members.fetch(memberId)
				member?.send({
					content:
						i18next.t('dm.wants_to_play', {
							lng: p.interaction.guildLocale ?? 'en',
							userId: p.interaction.user.id,
							game: selectedValues.join(', '),
						}) ?? '',
				})
			})
		}

		if (
			(selectedValues.includes('join_later') || selectedValues.includes('no')) &&
			message.members.map((member) => member.id).includes(p.interaction.user.id)
		)
			updatedMessage = await this.removeMember({ interaction: p.interaction })

		if (
			selectedValues.includes('join_later') &&
			!message.lateMembers.map((member) => member.id).includes(p.interaction.user.id)
		) {
			updatedMessage = await this.addPlayLaterMember({ interaction: p.interaction, games: [] })
			message.notifiedMembersId.forEach(async (memberId) => {
				const member = await p.interaction.message.guild?.members.fetch(memberId)
				member?.send({
					content:
						i18next.t('dm.maybe_later', {
							lng: p.interaction.guildLocale ?? 'en',
							userId: p.interaction.user.id,
							game: message.games.join(', '),
						}) ?? '',
				})
			})
		}

		if (
			!selectedValues.includes('join_later') &&
			message.lateMembers.map((member) => member.id).includes(p.interaction.user.id)
		)
			updatedMessage = await this.removePlayLaterMember({ interaction: p.interaction })

		if (selectedValues.includes('no')) {
			if (message.members.map((member) => member.id).includes(p.interaction.user.id))
				updatedMessage = await this.removeMember({ interaction: p.interaction })
			if (message.lateMembers.map((member) => member.id).includes(p.interaction.user.id))
				updatedMessage = await this.removePlayLaterMember({ interaction: p.interaction })
		}

		const author = await p.interaction.message.guild?.members.fetch(message.authorId)

		const gameInfos = await Promise.all(
			message.games.map((game) => SearchCommand.getGameInfos(game, this.videoGameProvider))
		)

		const selectRow = SearchCommand.createSelectRow({ context: p.interaction, games: updatedMessage.games })

		const buttonRow = SearchCommand.createButtonRow({ context: p.interaction }, gameInfos[0])

		const embedMessage = ComponentSearchPartnerMessageUtils.createOrUpdate({
			authorUsername: getDiscordUsername(p.interaction.member as GuildMember),
			authorPicture: author?.user.avatarURL() || '',
			games: updatedMessage.games,
			members: updatedMessage.members,
			lateMembers: updatedMessage.lateMembers,
			voiceChannelName: author?.voice.channel?.name,
			voiceChannelId: author?.voice.channel?.id,
			bgImgs: updatedMessage.bgImgs,
			locale: p.interaction.guildLocale ?? 'en',
			additionalInformations: updatedMessage.additionalInformations,
		}).addActionRowComponents(selectRow, buttonRow)

		await p.interaction.message.edit({
			components: [p.interaction.message.components[0], embedMessage],
			flags: MessageFlags.IsComponentsV2,
		})

		p.interaction.deleteReply()
	}

	async addMember(p: { interaction: StringSelectMenuInteraction; games: string[] }): Promise<SearchPartnerMessage> {
		return this.messageProvider.addMemberToMessageByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
			games: p.games,
		})
	}

	async removeMember(p: { interaction: StringSelectMenuInteraction }): Promise<SearchPartnerMessage> {
		return this.messageProvider.removeMemberToMessageByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
		})
	}

	async addPlayLaterMember(p: {
		interaction: StringSelectMenuInteraction
		games: string[]
	}): Promise<SearchPartnerMessage> {
		return this.messageProvider.addLateMemberToMessageByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
			games: p.games,
		})
	}

	async removePlayLaterMember(p: { interaction: StringSelectMenuInteraction }): Promise<SearchPartnerMessage> {
		return this.messageProvider.removeLateMemberToMessageByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
		})
	}

	async addGetNotified(p: { interaction: ButtonInteraction }): Promise<SearchPartnerMessage> {
		return this.messageProvider.addNotifiedMemberByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
		})
	}

	async removeGetNotified(p: { interaction: ButtonInteraction }): Promise<SearchPartnerMessage> {
		return this.messageProvider.removeNotifiedMemberByMessageId({
			msgId: p.interaction.message.id,
			memberId: p.interaction.user.id,
		})
	}
}
