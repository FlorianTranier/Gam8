# Partner Research

## About

Partner Research is a discord bot designed to help multi-gaming discord communities to find game partners

## Install it on your Discord server

[Click here to invite the bot on your server](https://discord.com/api/oauth2/authorize?client_id=700290127460827158&permissions=302251088&scope=bot)

Upon install, the bot will create a channel `#partner-research-bot`

The bot will live on this channel, you can rename it, but DON'T DELETE IT

## How to use

`-sp search <game>` : Say what you want to play at <game>, and wait for other players answers :)

`-sp clear` : Remove all messages from this bot (only if you have the permission to edit messages)

`-sp tag @role|reset` : choose a role to tag when a new search message is created (only if you have the permission to edit messages)

`-sp help` : displays help

### -sp search

#### Example usage

- Type `-sp search League of Legends`, it will create the following message

<img src="https://res.cloudinary.com/drq3rp3qd/image/upload/v1613324368/partner-research-doc/Capture_d_%C3%A9cran_2021-02-14_183732_ueq27i.png">

- Members of your server can interact with this using reactions

#### Reactions

☝️ : I want to play with you !

⏰ : I will maybe join later

🔔 : I want to get notified by private message when someone interact

🚫 : Delete this message (only if you are the author of this message)

## Build and deploy from source

### Requirements

- Nodejs 12+
- A Firebase project (You can create one for free [here](https://console.firebase.google.com/))
- A discord app (You can create one for free [here](https://discord.com/developers/applications/))

### Installation steps

- `git clone https://github.com/Blanymon/partner-research-v2`
- Add a `.env` file with the following variables

```
BOT_TOKEN=<Bot token from your discord app>
BOT_CHANNEL=<name of the channel that will be created and where the bot will live>
```

- Add your Firebase service account file under the name `src/config/firebase_credentials.json`
- Install dependencies `npm install`
- Run it with `npm start`
