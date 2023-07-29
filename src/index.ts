import { loadi18n } from './i18n/i18n'
import dotenv from 'dotenv'
import Discord from 'discord.js'
import admin from 'firebase-admin'
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

dotenv.config()

const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64 ?? '', 'base64').toString())

const params = {
	type: serviceAccount.type,
	projectId: serviceAccount.project_id,
	privateKeyId: serviceAccount.private_key_id,
	privateKey: serviceAccount.private_key,
	clientEmail: serviceAccount.client_email,
	clientId: serviceAccount.client_id,
	authUri: serviceAccount.auth_uri,
	tokenUri: serviceAccount.token_uri,
	authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
	clientC509CertUrl: serviceAccount.client_x509_cert_url,
}

console.log(params)

admin.initializeApp({
	credential: admin.credential.cert(params),
})

const db = admin.firestore()

loadi18n()
	.then(() => console.log(`i18n OK`))
	.catch(() => console.error(`i18n NOK`))

const client = new Discord.Client({ intents: 3276799, allowedMentions: { parse: ['users', 'roles'] } })

// Providers
const messageProvider = new DBMessageProvider({ db })
const channelProvider = new DBChannelProvider({ db })
const videoGameProvider = new VideoGameProvider()

// Commands
const commands = [
	new SearchCommand({ messageProvider, channelProvider, videoGameProvider }),
	new ClearCommand({ messageProvider }),
	new HelpCommand(),
	new TagCommand({ channelProvider }),
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
	client.guilds.cache.forEach(async (guild) => {
		const association = await channelProvider.getByGuildId({
			guildId: guild.id,
		})
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
		}
	})

	await Promise.all(jobs.map((job) => job.start()))
})

client.login(process.env.BOT_TOKEN)
