[![Docker deploy](https://github.com/FlorianTranier/partner-research-v2/actions/workflows/docker_deploy.yml/badge.svg?branch=main)](https://github.com/FlorianTranier/partner-research-v2/actions/workflows/docker_deploy.yml)
![License](https://badgen.net/github/license/FlorianTranier/partner-research-v2)
![Release](https://badgen.net/github/release/FlorianTranier/partner-research-v2/stable)

# Gam8

## About

**Gam8** is a Discord bot designed to help multi-gaming communities find gaming partners efficiently. It leverages Discord's latest features like Slash Commands and Components V2 to provide a rich, interactive experience.

## Install it on your Discord server

[Click here to invite the bot to your server](https://discord.com/api/oauth2/authorize?client_id=700290127460827158&permissions=302251088&scope=bot)

Upon installation, the bot will automatically create a dedicated channel (defaults to `#partner-research-bot`). The bot operates within this channel. You can rename it or move it to a category, but **DO NOT DELETE IT**.

## How to use

Partner Research uses **Slash Commands**. Simply type `/` in your Discord text box to see available commands.

- `/search <game> [game2] [game3] [game4] [additional_informations]`: Start a search for one or more games. Others can join using interactive components.
- `/event <channel> [announcement_channel]`: Create a Discord Scheduled Event with a modal for details.
- `/cancel`: Cancel all your active search messages.
- `/tag <@role>`: Choose a role to be notified when a new search is created (Requires `Manage Messages` permission).
- `/clear`: Remove all messages from this bot (Requires `Manage Messages` permission).
- `/help`: Displays help information.

### /search usage

When you use `/search`, the bot creates an interactive message:

- **Select Menu**: Members can choose which games they want to play, or indicate they'll join later.
- **Notify Me**: Members can opt-in to receive a private message notification when others interact with the search.
- **Link**: A direct link to the game's page on IGDB.com for more information.

## Build and deploy from source

### Requirements

- **Node.js 20+**
- **MongoDB**: A running MongoDB instance (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **AWS S3** (or compatible): For image processing and hosting
- **Discord App**: Create one at the [Discord Developer Portal](https://discord.com/developers/applications/)
- **Twitch App**: Create one at the [Twitch Developer Console](https://dev.twitch.tv/console/apps) to get the Client ID / Client Secret used by the [IGDB API](https://api-docs.igdb.com/) for fetching game information (Optional, but recommended)

### Installation steps

1. `git clone https://github.com/FlorianTranier/partner-research-v2`
2. `npm install`
3. Create a `.env` file in the root directory with the following variables:

```env
BOT_TOKEN=<Your Discord Bot Token>
BOT_CHANNEL=<Name of the channel the bot will create/use>
DB_CONN_STRING=<Your MongoDB connection string>
S3_ACCESS_KEY=<Your S3 Access Key>
S3_SECRET_KEY=<Your S3 Secret Key>
S3_ENDPOINT=<Your S3 Endpoint>
S3_BUCKET_NAME=<Your S3 Bucket Name>
TWITCH_CLIENT_ID=<Your Twitch App Client ID>
TWITCH_CLIENT_SECRET=<Your Twitch App Client Secret>
```

4. Build the project:
   `npm run build`
5. Start the bot:
   `npm start`

For development with hot-reload:
`npm run start:dev`
