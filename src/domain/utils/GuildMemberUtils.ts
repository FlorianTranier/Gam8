import { GuildMember } from 'discord.js'

export const getDiscordUsername = (member: GuildMember | undefined): string => {
	return member?.nickname ?? member?.user.globalName ?? member?.user.username ?? 'Anonymous'
}
