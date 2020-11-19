import { Client, TextChannel } from 'discord.js';
import EmbedSearchPartnerMessageUtils from '../../utils/EmbedSearchPartnerMessageUtils';
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider';
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider';

export default class VoiceStateListener {

  private readonly client: Client

  private readonly messageProvider: DBMessageProvider

  private readonly channelProvider: DBChannelProvider

  constructor(p: { client: Client, messageProvider: DBMessageProvider, channelProvider: DBChannelProvider }) {
    this.client = p.client
    this.messageProvider = p.messageProvider
    this.channelProvider = p.channelProvider

    this.createVoiceStateListener()
        .then(() => console.log(`${VoiceStateListener.name} OK`))
        .catch(() => console.error(`${VoiceStateListener.name} NOK`))
  }

  private async createVoiceStateListener() {
    this.client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {

      const userId = newVoiceState.member?.user.id || ''

      const messages = await this.messageProvider.getMessagesByAuthorId({
        authorId: userId
      })

      const botChannelId = (await this.channelProvider.getByGuildId({
        guildId: newVoiceState.guild.id
      }))?.channelId

      const botChannel = botChannelId ? newVoiceState.guild.channels.cache.find(
        channel => channel.id === botChannelId
      ) : undefined

      if (botChannel && botChannel instanceof TextChannel) {
        for (const message of messages) {

          const author = (await newVoiceState.guild?.members.fetch(message.authorId))

          const embedMessage = await EmbedSearchPartnerMessageUtils.createOrUpdate(
            {
              authorUsername: author?.user.username,
              authorPicture: author?.user.avatarURL() || undefined,
              membersId: message.membersId,
              game: message.game,
              voiceChannelName: author?.voice.channel?.name,
              voiceChannelInviteUrl: (await author?.voice.channel?.createInvite())?.url
            }
          )

          const discordMessage = await botChannel.messages.fetch(message.messageId)
          await discordMessage.edit('@here', embedMessage)
        }
      }
    })
  }

}