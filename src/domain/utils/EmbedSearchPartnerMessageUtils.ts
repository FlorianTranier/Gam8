import { Colors, EmbedBuilder, resolveColor, channelMention } from 'discord.js'
import i18next from 'i18next'
import { MessageMember } from '../models/messages/MessageMember'
import { emojiCounter } from './EmojiCounter'

export default {
	async createOrUpdate(p: {
		authorUsername: string
		authorPicture?: string
		games: string[]
		members: MessageMember[]
		lateMembers: MessageMember[]
		voiceChannelName?: string
		voiceChannelId?: string
		bgImg?: string
		locale: string
		additionalInformations?: string
		expired?: boolean
	}): Promise<EmbedBuilder> {
		const msg = new EmbedBuilder()

		const membersDisplay =
			p.members.map(member => member.id).length > 0
				? p.members.map((m) => `<@${m.id}> (${m.games.join(' / ')})`).join(', ')
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
						name: `↘️ ${emojiCounter(
							p.members.flatMap((member) => member.games).filter((memberGame) => memberGame === game).length
						)}`,
						value: `${game}`,
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

		if (p.lateMembers.map(member => member.id).length > 0) {
			const lateMembersDisplay = p.lateMembers.map(member => member.id).map((m) => `<@${m}>`).join(',')
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
