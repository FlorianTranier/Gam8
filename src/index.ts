import { loadi18n } from './i18n/i18n'
import Discord, { roleMention } from 'discord.js'
import CommandRouter from './routers/CommandRouter'
import DBMessageProvider from './providers/database/messages/DBMessageProvider'
import SearchCommand from './domain/services/commands/SearchCommand'
import ReactionRouter from './routers/ReactionRouter'
import DBChannelProvider from './providers/database/channels/DBChannelProvider'
import GuildChannelAssociation from './domain/models/channels/GuildChannelAssociation'
import VoiceStateListener from './domain/services/listeners/VoiceStateListener'
import ClearCommand from './domain/services/commands/ClearCommand'
import HelpCommand from './domain/services/commands/HelpCommand'
import TagCommand from './domain/services/commands/TagCommand'
import SelectReactionService from './domain/services/selectReactions/SelectReactionService'
import { VideoGameProvider } from './providers/rawg/games/VideoGameProvider'
import { ExpirationJob } from './domain/services/jobs/ExpirationJob'
import { MongoClient } from 'mongodb'
import { pino } from 'pino'
import CancelCommand from './domain/services/commands/CancelCommand'
import { ImageProvider } from './providers/s3/ImageProvider'
import EventCommand from './domain/services/commands/EventCommand'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const logger = pino({ level: 'info' })

const dbClient = new MongoClient(process.env.DB_CONN_STRING ?? '')

dbClient.connect()

const db = dbClient.db('partner-research')

loadi18n()
	.then(() => logger.info(`i18n loaded`))
	.catch(() => logger.error(`i18n NOK`))

const client = new Discord.Client({ intents: 3276799, allowedMentions: { parse: ['users', 'roles'] } })

// Providers
const messageProvider = new DBMessageProvider({ db })
const channelProvider = new DBChannelProvider({ db })
const videoGameProvider = new VideoGameProvider()
const imageProvider = new ImageProvider()

// Commands
const commands = [
	new SearchCommand({ messageProvider, channelProvider, videoGameProvider, imageProvider }),
	new ClearCommand({ messageProvider }),
	new HelpCommand(),
	new TagCommand({ channelProvider }),
	new CancelCommand({ messageProvider }),
	new EventCommand({ channelProvider })
]

// Reactions
const selectReactionService = new SelectReactionService({ messageProvider })

// Routers
new CommandRouter({ client, messageProvider, videoGameProvider, commands })
new ReactionRouter({ client, selectReactionService })

// Global Listeners
new VoiceStateListener({ client, messageProvider, channelProvider })

// Jobs
const jobs = [new ExpirationJob({ messageProvider, discordClient: client })]

client.on('guildCreate', async (guild) => {
	const channel = await guild.channels.create({
		name: `${process.env.BOT_CHANNEL}`,
		reason: 'PartnerResearch bot channel ! Welcome everyone !',
		type: Discord.ChannelType.GuildText,
	})

	await channelProvider.saveGuildChannelAssociation({
		guildChannelAssociation: new GuildChannelAssociation({
			guildId: guild.id,
			channelId: channel.id,
		}),
	})
})

client.on('ready', async () => {
	const announceState = await db.collection('announcement').findOne<{ shouldAnnounce: boolean }>()

	client.guilds.cache.forEach(async (guild) => {
		const association = await channelProvider.getByGuildId({
			guildId: guild.id,
		})

		if (announceState?.shouldAnnounce) {
			const { markdownNote } = <{ markdownNote: string }>await import(`./patchnotes/${process.env.VERSION}`)
			const channel = await client.channels.fetch(association?.channelId ?? '')
			if (channel != null && channel.isTextBased())
				channel.send({
					content: `${roleMention(association?.tagRoleId ?? '')}\n${markdownNote}`,
				})
		}

		if (!association) {
			const channel = await guild.channels.create({
				name: `${process.env.BOT_CHANNEL}`,
				reason: 'PartnerResearch bot channel ! Welcome everyone !',
				type: Discord.ChannelType.GuildText,
			})

			const message = await channel.send(
				'@here Welcome everyone ! This is the PartnerResearch V2 discord channel !' +
				`
Please don't delete this channel ! Otherwise, I'm not going to work anymore. You can safely rename this channel and move it as you please into groups
\`-sp search <game>\` : Say that you want to play at <game>, and wait for other players answers :)
\`-sp clear\` : Remove all messages from this bot (only if you have the permission to edit messages)
\`-sp help\` : display this message
\`-sp tag @role|reset\` : choose a role to tag when a new search message is created (only if you have the permission to edit messages)
`
			)
			await message.pin()

			await channelProvider.saveGuildChannelAssociation({
				guildChannelAssociation: new GuildChannelAssociation({
					guildId: guild.id,
					channelId: channel.id,
				}),
			})
			logger.info(
				{
					guildId: guild.id,
					guildName: guild.name,
					channelId: channel.id,
				},
				'Bot installed in a new guild !'
			)
		}
	})

	await Promise.all(jobs.map((job) => job.start()))

	logger.info('Gam8 started !')
})

client.login(process.env.BOT_TOKEN)

process.on('uncaughtException', (err) => {
	logger.fatal(err, 'Uncaught exception detected')
})

process.on('unhandledRejection', (err) => {
	logger.fatal(err, 'Unhandled rejection detected')
})
