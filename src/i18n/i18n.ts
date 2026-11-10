import i18next from 'i18next'

export const loadi18n = async (): Promise<void> => {
	await i18next.init({
		debug: true,
		fallbackLng: 'en',
		// Discord renders markdown, not HTML: escaping would turn "Assassin's Creed" into "Assassin&#39;s Creed"
		interpolation: { escapeValue: false },
		resources: {
			en: {
				translation: {
					commands: {
						search: {
							description: 'Say that you want to play at <game>, and wait for other players answers :)',
							game_option: 'What do you want to play ?',
							additional_informations: 'Add some additional informations',
						},
						event: {
							description: 'Create a scheduled event',
							channel_option: 'Where do you want to create the event ?',
							announcement_channel: 'Publish to an announcement channel ?',
							response: 'Event created',
							response_no_announce: 'Event created but not posted to announcement channel (no permission)',
						},
					},
					modal: {
						event: {
							title: 'Create new event',
							title_input: 'Title',
							description: 'Describe your event',
							date: 'date : DD/MM/YYYY, HH:mm',
							announcement: 'Announcement channel (DO NOT MODIFY)',
							voice_channel: 'Voice channel (DO NOT MODIFY)',
						},
					},
					embed: {
						title: '## {{author}} wants to play at {{game}}',
						answer_title: 'Answering the call',
						waiting_for_players: 'Waiting for players',
						maybe_joining_later: 'Maybe joining later',
						join_channel: 'Join vocal channel',
						additional_informations_title: 'Additional notes',
						expired: 'EXPIRED',
						expired_players: 'with {{members}}',
						expired_no_players: 'nobody answered',
						other: 'or',
					},
					actions: {
						placeholder: 'Are you coming ?',
						lets_go: `🚀 Let's go`,
						join_later: `⏰ Maybe I'll join later`,
						no: '😶‍🌫️ No.',
						notify_me: 'Notify me !',
						disable_notification: 'Disable notifications',
						reboot: '🔄️ Reboot',
					},
					response: {
						notification_validation: `You'll be notified when someone interact !`,
						notification_disabled: `You won't be notified, make sure to check if someone respond :)`,
					},
					dm: {
						wants_to_play: `<@{{userId}}> wants to play with you now at {{game}}`,
						maybe_later: `<@{{userId}}> wants to play with you maybe later at {{game}}`,
					},
				},
			},
			fr: {
				translation: {
					commands: {
						search: {
							description: 'Dis que tu veux jouer à <game>, et attends les réponses des autres joueurs :)',
							game_option: 'À jeu voulez-vous jouer?',
							additional_informations: 'Ajouter des informations supplémentaires',
						},
						event: {
							description: 'Créer un événement planifié',
							channel_option: "Où voulez-vous créer l'événement ?",
							announcement_channel: "Publier sur un channel d'annonce ?",
							response: 'Événement créé',
							response_no_announce: "Événement créé mais non publié sur le channel d'annonce (pas de permission)",
						},
					},
					modal: {
						event: {
							title: 'Créer un nouvel événement',
							title_input: 'Titre',
							description: 'Décrivez votre événement',
							date: 'date : JJ/MM/AAAA, HH:mm',
							announcement: "Channel d'annonce (NE PAS MODIFIER)",
							voice_channel: 'Channel vocal (NE PAS MODIFIER)',
						},
					},
					embed: {
						title: '## {{author}} veut jouer à {{game}}',
						answer_title: `Réponses à l'appel`,
						waiting_for_players: 'En attente de joueurs',
						maybe_joining_later: 'Peut-être plus tard',
						join_channel: 'Rejoindre le channel vocal',
						additional_informations_title: 'Détails',
						expired: 'EXPIRÉ',
						expired_players: 'avec {{members}}',
						expired_no_players: `personne n'a répondu`,
						other: 'ou',
					},
					actions: {
						placeholder: 'Est-ce que tu viens ?',
						lets_go: `🚀 J'arrive ! ({{game}})`,
						join_later: `⏰ Peut-être plus tard`,
						no: '😶‍🌫️ Non.',
						notify_me: `🔔 M'avertir des réponses`,
						disable_notification: `Ne pas m'avertir`,
						reboot: '🔄️ Relancer',
					},
					response: {
						notification_validation: `Tu seras averti par MP lorsque quelqu'un répondra à ton message !`,
						notification_disabled: `Tu ne seras plus averti, fais attention à regarder régulièrement si tu reçois une réponse :)`,
					},
					dm: {
						wants_to_play: `<@{{userId}}> veut jouer avec toi à {{game}}`,
						maybe_later: `<@{{userId}}> te rejoindra peut-être plus tard pour jouer à {{game}}`,
					},
				},
			},
		},
	})
}
