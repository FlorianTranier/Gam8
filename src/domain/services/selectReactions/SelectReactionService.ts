import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage'
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils'
import i18next from 'i18next'
import { getDiscordUsername } from '../../utils/GuildMemberUtils'

export default class SelectReactionService {
	private readonly messageProvider: DBMessageProvider

	constructor(p: { messageProvider: DBMessageProvider }) {
		this.messageProvider = p.messageProvider
	}

	async handleButtons(p: { interaction: ButtonInteraction }): Promise<void> {
		await p.interaction.deferReply({ ephemeral: true })

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
	}

	async handleSelectedValues(p: { interaction: StringSelectMenuInteraction }): Promise<void> {
		await p.interaction.deferReply({ ephemeral: true })

		const selectedValues = p.interaction.values

		const message = await this.messageProvider.getMessageByMessageId({ msgId: p.interaction.message.id })
		let updatedMessage = message

		if (
			!(selectedValues.includes('join_later') || selectedValues.includes('no'))
		) {
			if (message.members.map((member) => member.id).includes(p.interaction.user.id)) this.removeMember({ interaction: p.interaction })
			updatedMessage = await this.addMember({ interaction: p.interaction, games: selectedValues })
			message.notifiedMembersId.forEach(async (memberId) => {
				const member = await p.interaction.message.guild?.members.fetch(memberId)
				member?.send({
					content:
						i18next.t('dm.wants_to_play', {
							lng: p.interaction.guildLocale ?? 'en',
							userId: p.interaction.user.id,
							game: selectedValues[0],
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
							game: message.game,
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

		const embedMessage = await EmbedMessageGenerator.createOrUpdate({
			authorUsername: getDiscordUsername(author),
			authorPicture: author?.user.avatarURL() || undefined,
			members: updatedMessage.members,
			lateMembers: updatedMessage.lateMembers,
			games: updatedMessage.games,
			voiceChannelName: author?.voice.channel?.name,
			voiceChannelId: author?.voice.channel?.id,
			bgImg: updatedMessage.bgImg,
			locale: p.interaction.guildLocale ?? 'en',
			additionalInformations: updatedMessage.additionalInformations,
		})

		await p.interaction.message.edit({
			embeds: [embedMessage],
			components: p.interaction.message.components,
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
