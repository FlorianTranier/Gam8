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
          const discordMessage = await botChannel.messages.fetch(message.messageId)

          const previousEmbedMessage = discordMessage.embeds[0]

          const embedMessage = await EmbedSearchPartnerMessageUtils.createOrUpdate(
            {
              embedToUpdate: previousEmbedMessage,
              voiceChannelInviteUrl: (await newVoiceState.channel?.createInvite())?.url,
              voiceChannelName: newVoiceState.channel?.name
            }
          )

          await discordMessage.edit('@here', embedMessage)
        }
      }
    })
  }

}