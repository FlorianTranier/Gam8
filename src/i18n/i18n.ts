import i18next from 'i18next'

export const loadi18n = async (): Promise<void> => {
	await i18next.init({
		debug: true,
		fallbackLng: 'en',
		resources: {
			en: {
				translation: {
					embed: {
						title: '{{author}} wants to play at {{game}}',
						answer_title: 'Answering the call',
						waiting_for_players: 'Waiting for players',
						maybe_joining_later: 'Maybe joining later',
						join_channel: 'Join vocal channel',
						additional_informations_title: 'Additional notes',
						expired: 'EXPIRED',
						other: 'or',
					},
					actions: {
						placeholder: 'Are you coming ?',
						lets_go: `🚀 Let's go`,
						join_later: `⏰ Maybe I'll join later`,
						no: '😶‍🌫️ No.',
						notify_me: 'Notify me !',
						disable_notification: 'Disable notifications',
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
					embed: {
						title: '{{author}} veut jouer à {{game}}',
						answer_title: `Réponses à l'appel`,
						waiting_for_players: 'En attente de joueurs',
						maybe_joining_later: 'Peut-être plus tard',
						join_channel: 'Rejoindre le channel vocal',
						additional_informations_title: 'Détails',
						expired: 'EXPIRÉ',
						other: 'ou',
					},
					actions: {
						placeholder: 'Est-ce que tu viens ?',
						lets_go: `🚀 J'arrive ! ({{game}})`,
						join_later: `⏰ Peut-être plus tard`,
						no: '😶‍🌫️ Non.',
						notify_me: `🔔 M'avertir des réponses`,
						disable_notification: `Ne pas m'avertir`,
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
