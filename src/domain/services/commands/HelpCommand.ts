import CommandInterface from './CommandInterface'
import {
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	SeparatorBuilder,
	SeparatorSpacingSize,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from 'discord.js'
import i18next from 'i18next'

export default class HelpCommand implements CommandInterface {
	COMMAND = 'help'

	getSlashCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		return new SlashCommandBuilder()
			.setName(this.COMMAND)
			.setDescription(i18next.t('help.description', { lng: 'en' }) ?? '')
			.setDescriptionLocalizations({ fr: i18next.t('help.description', { lng: 'fr' }) })
			.toJSON()
	}

	async supportCommand(p: { command: string }): Promise<boolean> {
		return p.command === this.COMMAND
	}

	async exec(p: { context: ChatInputCommandInteraction }): Promise<void> {
		// The reader's own language, as the answer is only visible to them
		const lng = p.context.locale
		const t = (key: string, options: Record<string, unknown> = {}) => i18next.t(key, { lng, ...options }) ?? ''
		const command = await this.commandMentions(p.context)

		const container = new ContainerBuilder()
			.setAccentColor(3066993)
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(t('help.title')))
			.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`${t('help.search_title')}\n${t('help.search', { search: command('search') })}`
				),
				new TextDisplayBuilder().setContent(
					`${t('help.message_title')}\n${t('help.message', {
						notify: t('actions.notify_me'),
						follow: t('actions.follow_game'),
					})}`
				),
				new TextDisplayBuilder().setContent(
					`${t('help.commands_title')}\n${t('help.commands', {
						cancel: command('cancel'),
						event: command('event'),
						tag: command('tag'),
					})}`
				)
			)

		await p.context.reply({
			components: [container],
			flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
		})
	}

	/** Clickable command mentions (</search:id>), or plain "/search" if the ids cannot be fetched */
	private async commandMentions(context: ChatInputCommandInteraction): Promise<(name: string) => string> {
		const commands = context.client.application.commands
		try {
			if (commands.cache.size === 0) await commands.fetch()
		} catch {
			// Falls back to plain names below
		}
		return (name) => {
			const registered = commands.cache.find((cmd) => cmd.name === name)
			return registered ? `</${name}:${registered.id}>` : `\`/${name}\``
		}
	}
}
