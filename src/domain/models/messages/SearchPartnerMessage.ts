import { ObjectId } from 'mongodb'
import MessageType from './enums/MessageType'
import { MessageMember } from './MessageMember'

export default class SearchPartnerMessage {
	_id?: ObjectId
	serverId: string
	messageId: string
	authorId: string
	game: string
	games: string[]
	type: MessageType
	members: MessageMember[]
	lateMembers: MessageMember[]
	notifiedMembersId: string[]
	channelId: string
	bgImg: string
	additionalInformations?: string
	timestamp: number
	expired: boolean

	constructor(p: {
		_id?: string
		serverId: string
		messageId: string
		authorId: string
		game: string
		games: string[]
		type: MessageType
		members: MessageMember[]
		lateMembers: MessageMember[]
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
		this.games = p.games
		this.type = p.type
		this.members = p.members ?? []
		this.lateMembers = p.lateMembers ?? []
		this.channelId = p.channelId
		this.notifiedMembersId = p.notifiedMembersId ?? []
		this.bgImg = p.bgImg
		this.timestamp = p.timestamp ?? new Date().getTime()
		this.additionalInformations = p.additionalInformations
		this.expired = p.expired ?? false
	}
}
