import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageActionRowComponentBuilder,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js'
import MessageType from '../../models/messages/enums/MessageType'
import SearchPartnerMessage from '../../models/messages/SearchPartnerMessage'
import DBMessageProvider from '../../../providers/database/messages/DBMessageProvider'
import CommandInterface from './CommandInterface'
import EmbedMessageGenerator from '../../utils/EmbedSearchPartnerMessageUtils'
import axios from 'axios'
import DBChannelProvider from '../../../providers/database/channels/DBChannelProvider'

export default class SearchCommand implements CommandInterface {
  COMMAND = 'search'

  private readonly messageProvider: DBMessageProvider
  private readonly channelProvider: DBChannelProvider

  constructor(p: { messageProvider: DBMessageProvider; channelProvider: DBChannelProvider }) {
    this.messageProvider = p.messageProvider
    this.channelProvider = p.channelProvider
  }

  getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return new SlashCommandBuilder()
      .setDescription('Say that you want to play at <game>, and wait for other players answers :)')
      .setName(this.COMMAND)
      .addStringOption(option =>
        option.setName('game').setDescription('What do you want to play ?').setRequired(true).setMaxLength(255)
      )
      .setDMPermission(false)
      .toJSON()
  }

  async supportCommand(p: { command: string }): Promise<boolean> {
    return p.command == this.COMMAND
  }

  async exec(p: { context: ChatInputCommandInteraction }): Promise<void> {
    const game = p.context.options.getString('game') ?? ''

    const imgUrl = (await axios.get('https://api.thecatapi.com/v1/images/search')).data[0].url

    const author = await p.context.guild?.members.fetch(p.context.member?.user.id ?? '')

    const association = await this.channelProvider.getByGuildId({ guildId: p.context.guild?.id ?? '' })

    const tag = association?.tagRoleId ? `<@&${association.tagRoleId}>` : ''

    await p.context.reply(tag)

    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Are you coming ?').addOptions(
        {
          label: `🚀 Let's go`,
          value: 'im_here',
        },
        {
          label: `⏰ Maybe I'll join later`,
          value: 'join_later',
        },
        {
          label: `😶‍🌫️ No.`,
          value: 'no',
        }
      )
    )

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('notify').setLabel('Notify me !').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('dont_notify').setLabel('Disable notifications').setStyle(ButtonStyle.Secondary)
    )

    const message = await p.context.channel?.send({
      embeds: [
        await EmbedMessageGenerator.createOrUpdate({
          authorUsername: p.context.member?.user.username,
          authorPicture: author?.user.avatarURL() || '',
          game,
          membersId: [],
          lateMembersId: [],
          img: imgUrl,
          voiceChannelName: author?.voice.channel?.name,
          voiceChannelInviteUrl: (await author?.voice.channel?.createInvite())?.url,
        }),
      ],
      components: [buttonRow, selectRow],
    })

    await this.messageProvider.saveMessage({
      message: new SearchPartnerMessage({
        serverId: p.context.guild?.id || '',
        authorId: p.context.member?.user.id || '',
        messageId: message?.id || '',
        game,
        type: MessageType.RESEARCH_PARTNER,
        membersId: [],
        lateMembersId: [],
        channelId: p.context.channel?.id || '',
        catUrl: imgUrl,
      }),
    })
  }
}
