import { Colors, EmbedBuilder, resolveColor, channelMention } from 'discord.js'
import i18next from 'i18next'

export default {
	async createOrUpdate(p: {
		authorUsername: string
		authorPicture?: string
		games: string[]
		membersId: string[]
		lateMembersId: string[]
		voiceChannelName?: string
		voiceChannelId?: string
		bgImg?: string
		locale: string
		additionalInformations?: string
		expired?: boolean
	}): Promise<EmbedBuilder> {
		const msg = new EmbedBuilder()

		const membersDisplay =
			p.membersId.length > 0
				? p.membersId.map((m) => `<@${m}>`).join(', ')
				: i18next.t('embed.waiting_for_players', { lng: p.locale })

		msg
			.setAuthor({
				name: p.authorUsername,
				iconURL: p.authorPicture || undefined,
			})
			.setTitle(
				p.expired
					? `[${i18next.t('embed.expired', { lng: p.locale })}] ${p.games.length <= 1 ? '- ' + p.games[0] : ''}`
					: i18next.t('embed.title', {
							lng: p.locale,
							author: p.authorUsername,
							game: p.games.length <= 1 ? p.games[0] : '',
					  })
			)

		if (p.games.length > 1) {
			msg.addFields(
			p.games.map((game) => {
					return {
						name: '↘️',
						value: game,
						inline: true,
					}
				})
			)
		}
		

		if (p.additionalInformations) {
			msg.addFields([
				{ name: i18next.t('embed.additional_informations_title', { lng: p.locale }), value: p.additionalInformations },
			])
		}

		if (p.bgImg) {
			msg.setImage(p.bgImg)
		}

		msg
			.addFields([{ name: i18next.t('embed.answer_title', { lng: p.locale }), value: membersDisplay }])
			.setTimestamp()
			.setColor(resolveColor(p.expired ? Colors.LightGrey : 'Random'))

		if (p.lateMembersId.length > 0) {
			const lateMembersDisplay = p.lateMembersId.map((m) => `<@${m}>`).join(',')
			msg.addFields([
				{
					name: i18next.t('embed.maybe_joining_later', { lng: p.locale }),
					value: lateMembersDisplay || i18next.t('embed.waiting_for_players', { lng: p.locale }),
				},
			])
		}

		if (p.voiceChannelName && p.voiceChannelId) {
			msg.addFields([
				{
					name: i18next.t('embed.join_channel', { lng: p.locale }),
					value: channelMention(p.voiceChannelId) //`[${p.voiceChannelName}](${p.voiceChannelInviteUrl})`,
				},
			])
		}

		return msg
	},
}
