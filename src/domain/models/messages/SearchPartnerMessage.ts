import MessageType from './enums/MessageType'


export default class SearchPartnerMessage {

  serverId: string
  messageId: string
  authorId: string
  game: string
  type: MessageType
  membersId: string[]
  lateMembersId: string[]
  channelId: string
  catUrl: string

  constructor(p: {
    serverId: string,
    messageId: string,
    authorId: string,
    game: string,
    type: MessageType,
    membersId: string[],
    lateMembersId: string[],
    channelId: string,
    catUrl: string
  }) {
    this.serverId = p.serverId
    this.messageId = p.messageId
    this.authorId = p.authorId
    this.game = p.game
    this.type = p.type
    this.membersId = p.membersId
    this.lateMembersId = p.lateMembersId
    this.channelId = p.channelId
    this.catUrl = p.catUrl
  }
}