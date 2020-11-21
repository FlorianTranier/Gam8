import dotenv from 'dotenv'
import Discord from 'discord.js'
import admin from 'firebase-admin'
import CommandRouter from './routers/CommandRouter'

import * as serviceAccount from './config/firebase_credentials.json'
import DBMessageProvider from './providers/database/messages/DBMessageProvider'
import SearchCommand from './domain/services/commands/SearchCommand'
import ReactionRouter from './routers/ReactionRouter'
import ReactionInterface from './domain/services/reactions/ReactionInterface'
import AddMemberSearchPartnerMessageReaction from './domain/services/reactions/AddMemberSearchPartnerMessageReaction'
import RemoveMemberSearchPartnerMessageReaction from './domain/services/reactions/RemoveMemberSearchPartnerMessageReaction'
import DBChannelProvider from './providers/database/channels/DBChannelProvider'
import GuildChannelAssociation from './domain/models/channels/GuildChannelAssociation'
import VoiceStateListener from './domain/services/listeners/VoiceStateListener'
import ClearCommand from './domain/services/commands/ClearCommand';
import AddPlayLaterSearchPartnerMessageReaction
  from './domain/services/reactions/AddPlayLaterSearchPartnerMessageReaction';
import RemovePlayLaterSearchPartnerMessageReaction
  from './domain/services/reactions/RemovePlayLaterSearchPartnerMessageReaction';
import HelpCommand from "./domain/services/commands/HelpCommand";

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
  clientC509CertUrl: serviceAccount.client_x509_cert_url
}

dotenv.config()

admin.initializeApp({
  credential: admin.credential.cert(params)
})

const db = admin.firestore()

const client = new Discord.Client()

// Providers
const messageProvider = new DBMessageProvider({ db })
const channelProvider = new DBChannelProvider({ db })

// Commands
const commands = [
  new SearchCommand({ messageProvider }),
  new ClearCommand({ messageProvider }),
  new HelpCommand()
]

// Reactions
const reactions: ReactionInterface[] = [
  new AddMemberSearchPartnerMessageReaction({ messageProvider }),
  new RemoveMemberSearchPartnerMessageReaction({ messageProvider }),
  new AddPlayLaterSearchPartnerMessageReaction({ messageProvider }),
  new RemovePlayLaterSearchPartnerMessageReaction({ messageProvider })
]


// Routers
new CommandRouter({ client, channelProvider, commands })
new ReactionRouter({ client, messageProvider, reactions })

// Global Listeners
new VoiceStateListener({ client, messageProvider, channelProvider })

client.on('guildCreate', async guild => {
  const channel = await guild.channels.create(`${process.env.BOT_CHANNEL}`, {
    reason: 'PartnerResearch bot channel ! Welcome everyone !',
    type: 'text'
  })

  await channelProvider.saveGuildChannelAssociation({
    guildChannelAssociation: new GuildChannelAssociation({
      guildId: guild.id,
      channelId: channel.id
    })
  })
})

client.on('ready', () => {
  client.guilds.cache.forEach(async guild => {
    const association = await channelProvider.getByGuildId({ guildId: guild.id })
    if (!association) {
      const channel = await guild.channels.create(`${process.env.BOT_CHANNEL}`, {
        reason: 'PartnerResearch bot channel ! Welcome everyone !',
        type: 'text'
      })

      const message = await channel.send(
        '@here Welcome everyone ! This is the PartnerResearch V2 discord channel !'
        +
        `
\`-sp search <game>\` : Say that you want to play at <game>, and wait for other players answers :)
\`-sp clear\` : Remove all messages from this bot (only if you have the correct permissions to delete messages)
\`-sp help\` : display this message
`
      )
      await message.pin()


      await channelProvider.saveGuildChannelAssociation({
        guildChannelAssociation: new GuildChannelAssociation({
          guildId: guild.id,
          channelId: channel.id
        })
      })
    }
  })
})

client.login(process.env.BOT_TOKEN)