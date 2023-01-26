import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage'
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils'

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

    if (updatedMessage.notifiedMembersId.includes(p.interaction.user.id)) p.interaction.editReply(`You'll be notified`)
    else p.interaction.editReply(`You won't be notified`)
  }

  async handleSelectedValues(p: { interaction: StringSelectMenuInteraction }): Promise<void> {
    await p.interaction.deferReply({ ephemeral: true })

    const selectedValues = p.interaction.values

    const message = await this.messageProvider.getMessageByMessageId({ msgId: p.interaction.message.id })
    let updatedMessage = message

    if (selectedValues.includes('im_here') && !message.membersId.includes(p.interaction.user.id)) {
      updatedMessage = await this.addMember({ interaction: p.interaction })
      message.notifiedMembersId.forEach(async memberId => {
        const member = await p.interaction.message.guild?.members.fetch(memberId)
        member?.send(`<@${p.interaction.user.id}> wants to play with you now at ${message.game}`)
      })
    }

    if (!selectedValues.includes('im_here') && message.membersId.includes(p.interaction.user.id))
      updatedMessage = await this.removeMember({ interaction: p.interaction })

    if (selectedValues.includes('join_later') && !message.lateMembersId.includes(p.interaction.user.id)) {
      updatedMessage = await this.addPlayLaterMember({ interaction: p.interaction })
      message.notifiedMembersId.forEach(async memberId => {
        const member = await p.interaction.message.guild?.members.fetch(memberId)
        member?.send(`<@${p.interaction.user.id}> wants to play with you maybe later at ${message.game}`)
      })
    }

    if (!selectedValues.includes('join_later') && message.lateMembersId.includes(p.interaction.user.id))
      updatedMessage = await this.removePlayLaterMember({ interaction: p.interaction })

    if (selectedValues.includes('no')) {
      if (message.membersId.includes(p.interaction.user.id))
        updatedMessage = await this.removeMember({ interaction: p.interaction })
      if (message.lateMembersId.includes(p.interaction.user.id))
        updatedMessage = await this.removePlayLaterMember({ interaction: p.interaction })
    }

    const author = await p.interaction.message.guild?.members.fetch(message.authorId)

    const embedMessage = await EmbedMessageGenerator.createOrUpdate({
      authorUsername: author?.user.username,
      authorPicture: author?.user.avatarURL() || undefined,
      membersId: updatedMessage.membersId,
      lateMembersId: updatedMessage.lateMembersId,
      game: updatedMessage.game,
      voiceChannelName: author?.voice.channel?.name,
      voiceChannelInviteUrl: (await author?.voice.channel?.createInvite())?.url,
      img: updatedMessage.catUrl,
    })

    await p.interaction.message.edit({
      embeds: [embedMessage],
      components: p.interaction.message.components,
    })

    p.interaction.deleteReply()
  }

  async addMember(p: { interaction: StringSelectMenuInteraction }): Promise<SearchPartnerMessage> {
    return this.messageProvider.addMemberToMessageByMessageId({
      msgId: p.interaction.message.id,
      memberId: p.interaction.user.id,
    })
  }

  async removeMember(p: { interaction: StringSelectMenuInteraction }): Promise<SearchPartnerMessage> {
    return this.messageProvider.removeMemberToMessageByMessageId({
      msgId: p.interaction.message.id,
      memberId: p.interaction.user.id,
    })
  }

  async addPlayLaterMember(p: { interaction: StringSelectMenuInteraction }): Promise<SearchPartnerMessage> {
    return this.messageProvider.addLateMemberToMessageByMessageId({
      msgId: p.interaction.message.id,
      memberId: p.interaction.user.id,
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
