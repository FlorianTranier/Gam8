import { CronJob } from 'cron'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import { DateTime } from 'luxon'
import { Job } from './Job'
import { Client, TextBasedChannel } from 'discord.js'
import EmbedSearchPartnerMessageUtils from '../../utils/EmbedSearchPartnerMessageUtils'

export class ExpirationJob extends Job {
  protected job: CronJob
  private readonly messageProvider: DBMessageProvider
  private readonly client: Client

  constructor(p: { messageProvider: DBMessageProvider; discordClient: Client }) {
    super()
    this.messageProvider = p.messageProvider
    this.client = p.discordClient

    this.job = new CronJob('0 0 * * * *', this.handler.bind(this))
  }

  private async handler() {
    console.log('Handler', this.messageProvider)
    const messages = await this.messageProvider.getMessagesBetweenDate({
      start: DateTime.now().minus({ days: 1 }).toJSDate(),
      end: DateTime.now().minus({ hours: 3 }).toJSDate(),
    })

    await Promise.all(
      messages.map(async message => {
        const discordChannel = <TextBasedChannel>await this.client.channels.fetch(message.channelId, { cache: false })

        const discordMessage = await discordChannel?.messages.fetch({
          message: message.messageId,
          cache: false,
        })

        const author = await discordMessage.guild?.members.fetch(message.authorId)

        const embedMessage = await EmbedSearchPartnerMessageUtils.createOrUpdate({
          authorUsername: author?.user.username,
          authorPicture: author?.user.avatarURL() || undefined,
          membersId: message.membersId,
          lateMembersId: message.lateMembersId,
          game: message.game,
          bgImg: `https://unsplash.com/photos/zcKEj-Jq02g/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MzB8fGdvbmV8ZnJ8MHx8fHwxNjkwNTc5NTQxfDA&force=true&w=1920`,
          locale: discordMessage.guild?.preferredLocale ?? 'en',
          additionalInformations: message.additionalInformations,
          expired: true,
        })

        return discordMessage.edit({
          embeds: [embedMessage],
          components: [],
        })
      })
    )
  }
}
