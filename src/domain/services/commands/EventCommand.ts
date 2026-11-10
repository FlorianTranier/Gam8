import { RESTPostAPIChatInputApplicationCommandsJSONBody, ChatInputCommandInteraction, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, ModalSubmitInteraction, ChannelType, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, GuildTextBasedChannel, PermissionFlagsBits, MessageFlags } from "discord.js";
import CommandInterface from "./CommandInterface";
import DBChannelProvider from "../../../providers/database/channels/DBChannelProvider";
import i18next from "i18next";

export default class EventCommand implements CommandInterface {
  COMMAND = 'event'

  private readonly channelProvider: DBChannelProvider

  constructor(p: {
    channelProvider: DBChannelProvider
  }) {
    this.channelProvider = p.channelProvider
  }

  getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return new SlashCommandBuilder()
      .setDescription(i18next.t('commands.event.description', { lng: 'en' }))
      .setDescriptionLocalizations({
        fr: i18next.t('commands.event.description', { lng: 'fr' })
      })
      .setName(this.COMMAND)
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription(i18next.t('commands.event.channel_option', { lng: 'en' }))
          .setDescriptionLocalizations({
            fr: i18next.t('commands.event.channel_option', { lng: 'fr' })
          })
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true)
      )
      .addChannelOption((option) =>
        option
          .setName('announcement_channel')
          .setDescription(i18next.t('commands.event.announcement_channel', { lng: 'en' }))
          .setDescriptionLocalizations({
            fr: i18next.t('commands.event.announcement_channel', { lng: 'fr' })
          })
          .addChannelTypes(ChannelType.GuildAnnouncement)
          .setRequired(false)
      )
      .toJSON()
  }

  async supportCommand(p: { command: string }): Promise<boolean> {
    return p.command == this.COMMAND
  }

  async exec(p: { context: ChatInputCommandInteraction | undefined; }): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('modalEvent')
      .setTitle(i18next.t('modal.event.title', { lng: p.context?.guildLocale ?? 'en' }))

    const titleInput = new TextInputBuilder()
      .setCustomId('modalEventTitleInput')
      .setStyle(TextInputStyle.Short)

    const descriptionInput = new TextInputBuilder()
      .setCustomId('modalEventDescriptionInput')
      .setStyle(TextInputStyle.Paragraph)

    const dateInput = new TextInputBuilder()
      .setCustomId('modalEventDateInput')
      .setStyle(TextInputStyle.Short)
      .setMinLength(17)
      .setMaxLength(17)
      .setValue(new Date().toLocaleString('en-GB',
        {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }
      ))

    const publishAnnouncementInput = new TextInputBuilder()
      .setCustomId('modalEventPublishAnnouncementInput')
      .setStyle(TextInputStyle.Short)
      .setValue(p.context?.options.getChannel('announcement_channel')?.id ?? '')


    const voiceChannelInput = new TextInputBuilder()
      .setCustomId('modalEventVoiceChannelInput')
      .setValue(p.context?.options.getChannel('channel')?.id ?? '')
      .setStyle(TextInputStyle.Paragraph)

    const lng = p.context?.guildLocale ?? 'en'
    modal.addLabelComponents(
      ([
        ['modal.event.title_input', titleInput],
        ['modal.event.description', descriptionInput],
        ['modal.event.date', dateInput],
        ['modal.event.announcement', publishAnnouncementInput],
        ['modal.event.voice_channel', voiceChannelInput],
      ] as const).map(([labelKey, input]) =>
        new LabelBuilder().setLabel(i18next.t(labelKey, { lng })).setTextInputComponent(input)
      )
    )
    await p.context?.showModal(modal)
  }

  async submitHandler(p: { context: ModalSubmitInteraction }): Promise<void> {
    const association = await this.channelProvider.getByGuildId({ guildId: p.context.guild?.id ?? '' })

    const tag = association?.tagRoleId ? `<@&${association.tagRoleId}>` : ''

    await p.context.deferReply({
      flags: MessageFlags.Ephemeral
    })
    const title = p.context.fields.getTextInputValue('modalEventTitleInput')
    const description = p.context.fields.getTextInputValue('modalEventDescriptionInput')
    const [day, month, year, hours, minutes] = p.context.fields.getTextInputValue('modalEventDateInput')
      .replace(' ', '')
      .split(/[/,:]/)
      .map((value) => parseInt(value))

    const publishAnnouncement = p.context.fields.getTextInputValue('modalEventPublishAnnouncementInput')
    const voiceChannel = p.context.fields.getTextInputValue('modalEventVoiceChannelInput')

    const event = await p.context.guild?.scheduledEvents.create({
      channel: voiceChannel,
      entityType: GuildScheduledEventEntityType.Voice,
      name: title,
      description: description,
      scheduledStartTime: new Date(year, month - 1, day, hours, minutes),
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    })

    const inviteUrl = await event?.createInviteURL()



    if (publishAnnouncement) {
      const announcementChannel = await p.context.guild?.channels.fetch(publishAnnouncement) as GuildTextBasedChannel;
      if (announcementChannel?.permissionsFor(p.context.user)?.has(PermissionFlagsBits.SendMessages)) {
        await announcementChannel.send({
          content: `${tag} ${title}\n\n${description}\n\n${inviteUrl}`,
        });
      } else {
        await p.context.editReply({
          content: i18next.t('commands.event.response_no_announce', { lng: p.context.guildLocale ?? 'en' })
        })
      }
    }

    await p.context.editReply({
      content: i18next.t('commands.event.response', { lng: p.context.guildLocale ?? 'en' })
    })
  }
}