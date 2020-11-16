import dotenv from 'dotenv'
import Discord from 'discord.js'
import admin from 'firebase-admin'
import CommandRouter from './commands/CommandRouter'

import * as serviceAccount from './config/firebase_credentials.json'
import DBMessageProvider from './providers/database/messages/DBMessageProvider'
import SPCommand from './commands/SPCommand'
import ReactionRouter from './domain/reactions/ReactionRouter'
import ReactionInterface from './domain/reactions/ReactionInterface'
import AddMemberSearchPartnerMessageReaction from './domain/reactions/SetMemberSearchPartnerMessageReaction'

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

// Commands
const commands = [
  new SPCommand({ messageProvider })
]

// Reactions
const reactions: ReactionInterface[] = [
  new AddMemberSearchPartnerMessageReaction({ messageProvider })
]


// Routers
new CommandRouter({ client, messageProvider, commands })
new ReactionRouter({ client, messageProvider, reactions })

client.login(process.env.BOT_TOKEN)