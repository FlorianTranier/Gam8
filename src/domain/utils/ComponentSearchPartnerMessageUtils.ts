import {
	channelMention,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from 'discord.js'
import i18next from 'i18next'
import { MessageMember } from '../models/messages/MessageMember'

const createOrUpdate = (p: {
	authorUsername: string
	authorPicture?: string
	games: string[]
	members: MessageMember[]
	lateMembers: MessageMember[]
	voiceChannelName?: string
	voiceChannelId?: string
	bgImgs?: string[]
	locale: string
	additionalInformations?: string
	expired?: boolean
}): ContainerBuilder => {
	const msgBaseContainer = new ContainerBuilder()

	if (p.expired) {
		msgBaseContainer.setAccentColor(10070709)
	} else {
		msgBaseContainer.setAccentColor(3066993)
	}

	// Create header section
	const titleSection = new SectionBuilder()
		.setThumbnailAccessory(
			new ThumbnailBuilder().setURL(
				p.expired ? `https://flyimg.ftranier.fr/upload/clsp_Gray/${p.authorPicture}` : p.authorPicture ?? ''
			)
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				p.expired
					? `[${i18next.t('embed.expired', { lng: p.locale })}] ${p.games.length <= 1 ? '- ' + p.games[0] : ''}`
					: i18next.t('embed.title', {
							lng: p.locale,
							author: p.authorUsername,
							game: p.games.length <= 1 ? p.games[0] : '',
					  })
			)
		)

	msgBaseContainer.addSectionComponents(titleSection)

	// Add games section if multiple games
	if (p.games.length > 1) {
		const gameText = new TextDisplayBuilder().setContent(p.games.map((game) => `***${game}***`).join(' | '))
		titleSection.addTextDisplayComponents(gameText)
		msgBaseContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
	}

	// Add additional information if present
	if (p.additionalInformations) {
		msgBaseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(p.additionalInformations))
		msgBaseContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
	}

	// Add members section

	titleSection.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			i18next.t('embed.answer_title', { lng: p.locale }) +
				'\n' +
				(p.members.length > 0
					? p.members.map((m) => `<@${m.id}> (${m.games.join(' / ')})`).join(', ')
					: i18next.t('embed.waiting_for_players', { lng: p.locale }))
		)
	)

	// Add late members section if present
	if (p.lateMembers.length > 0) {
		msgBaseContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(i18next.t('embed.maybe_joining_later', { lng: p.locale })),
			new TextDisplayBuilder().setContent(p.lateMembers.map((member) => `<@${member.id}>`).join(', '))
		)
	}

	// Add voice channel section if present
	if (p.voiceChannelName && p.voiceChannelId) {
		msgBaseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(channelMention(p.voiceChannelId)))
	}

	// Add background image if present
	if (p.bgImgs && !p.expired) {
		const size = p.bgImgs.length > 1 ? 250 : 350
		const image = new MediaGalleryBuilder().addItems(
			p.bgImgs.map((bgImg) =>
				new MediaGalleryItemBuilder().setURL(`https://flyimg.ftranier.fr/upload/w_${size}/${bgImg}`)
			)
		)
		msgBaseContainer.addMediaGalleryComponents(image)
		msgBaseContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
	}

	return msgBaseContainer
}

export default {
	createOrUpdate,
}
