import MessageType from './enums/MessageType'

export default class SearchPartnerMessage {
	serverId: string
	messageId: string
	authorId: string
	game: string
	type: MessageType
	membersId: string[]
	lateMembersId: string[]
	notifiedMembersId: string[]
	channelId: string
	bgImg: string
	additionalInformations?: string
	timestamp: number
	expired: boolean

	constructor(p: {
		serverId: string
		messageId: string
		authorId: string
		game: string
		type: MessageType
		membersId: string[]
		lateMembersId: string[]
		notifiedMembersId?: string[]
		channelId: string
		bgImg: string
		additionalInformations?: string
		timestamp?: number
		expired?: boolean
	}) {
		this.serverId = p.serverId
		this.messageId = p.messageId
		this.authorId = p.authorId
		this.game = p.game
		this.type = p.type
		this.membersId = p.membersId
		this.lateMembersId = p.lateMembersId
		this.channelId = p.channelId
		this.notifiedMembersId = p.notifiedMembersId ?? []
		this.bgImg = p.bgImg
		this.timestamp = p.timestamp ?? new Date().getTime()
		this.additionalInformations = p.additionalInformations
		this.expired = p.expired ?? false
	}
}
