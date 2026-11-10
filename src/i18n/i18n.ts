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
						follow_game: '⭐ Follow the game',
					},
					response: {
						notification_validation: `You'll be notified when someone interact !`,
						notification_disabled: `You won't be notified, make sure to check if someone respond :)`,
					},
					dm: {
						wants_to_play: `<@{{userId}}> wants to play with you now at {{game}}`,
						maybe_later: `<@{{userId}}> wants to play with you maybe later at {{game}}`,
					},
					help: {
						description: 'How Gam8 works',
						title: '## 🎮 Gam8\nFind people to play with, whatever the game.',
						search_title: '### Start a search',
						search:
							'{{search}} with up to 4 games and an optional note. The search mentions the server role if one is set, shows your voice channel if you are in one, and expires after 3 hours.',
						message_title: '### On a search message',
						message:
							'- **Menu**: answer with the games you want to play, "maybe later" or "no"\n- **{{notify}}**: get a DM whenever someone answers this search\n- **{{follow}}**: get a DM for every new search for this game on this server, each with a button to unsubscribe\n- **?**: the game\'s page on IGDB',
						commands_title: '### Other commands',
						commands:
							'- {{cancel}}: close all your ongoing searches on this server\n- {{event}}: create a scheduled Discord event\n- {{tag}}: choose the role mentioned on every new search (moderators)',
					},
					subscription: {
						choose_games: 'Which games do you want to follow?',
						already_followed: 'Already followed',
						response_subscribed: 'Done! Check your DMs 📬',
						response_already: 'You already follow {{games}}. To unsubscribe, use the button in your DMs.',
						response_dm_closed: `I can't send you DMs, so the subscription was cancelled. Allow direct messages from this server's members in your privacy settings, then try again.`,
						dm_subscribed:
							'⭐ **Subscription enabled**\nYou will get a DM every time someone looks for players for {{games}} on **{{guild}}**.\nTo stop, click the button below, here or under any of these notifications.',
						dm_new_search: '🎮 **{{author}}** is looking for players for {{games}} on **{{guild}}**!',
						view_search: 'View the search',
						unsubscribe: 'Unsubscribe from {{game}}',
						unsubscribed: 'Unsubscribed from {{game}}',
						unsubscribed_short: 'Unsubscribed',
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
						follow_game: '⭐ Suivre le jeu',
					},
					response: {
						notification_validation: `Tu seras averti par MP lorsque quelqu'un répondra à ton message !`,
						notification_disabled: `Tu ne seras plus averti, fais attention à regarder régulièrement si tu reçois une réponse :)`,
					},
					dm: {
						wants_to_play: `<@{{userId}}> veut jouer avec toi à {{game}}`,
						maybe_later: `<@{{userId}}> te rejoindra peut-être plus tard pour jouer à {{game}}`,
					},
					help: {
						description: 'Comment fonctionne Gam8',
						title: '## 🎮 Gam8\nTrouve des coéquipiers, quel que soit le jeu.',
						search_title: '### Lancer une recherche',
						search:
							"{{search}} avec jusqu'à 4 jeux et une note facultative. La recherche mentionne le rôle du serveur s'il y en a un, affiche ton salon vocal si tu es connecté, et expire au bout de 3 heures.",
						message_title: '### Sur un message de recherche',
						message:
							"- **Menu** : réponds avec les jeux auxquels tu veux jouer, « plus tard » ou « non »\n- **{{notify}}** : reçois un MP quand quelqu'un répond à cette recherche\n- **{{follow}}** : reçois un MP à chaque nouvelle recherche pour ce jeu sur ce serveur, avec un bouton pour te désabonner dans chacun\n- **?** : la fiche du jeu sur IGDB",
						commands_title: '### Autres commandes',
						commands:
							'- {{cancel}} : ferme toutes tes recherches en cours sur ce serveur\n- {{event}} : crée un événement Discord planifié\n- {{tag}} : choisis le rôle mentionné à chaque nouvelle recherche (modérateurs)',
					},
					subscription: {
						choose_games: 'Quels jeux veux-tu suivre ?',
						already_followed: 'Déjà suivi',
						response_subscribed: "C'est noté ! Regarde tes MP 📬",
						response_already: 'Tu suis déjà {{games}}. Pour te désabonner, utilise le bouton dans tes MP.',
						response_dm_closed: `Je ne peux pas t'envoyer de MP, donc l'abonnement a été annulé. Autorise les messages privés des membres de ce serveur dans tes paramètres de confidentialité, puis réessaie.`,
						dm_subscribed:
							"⭐ **Abonnement activé**\nTu recevras un MP chaque fois que quelqu'un cherche des joueurs pour {{games}} sur **{{guild}}**.\nPour arrêter, clique sur le bouton ci-dessous, ici ou sous n'importe laquelle de ces notifications.",
						dm_new_search: '🎮 **{{author}}** cherche des joueurs pour {{games}} sur **{{guild}}** !',
						view_search: 'Voir la recherche',
						unsubscribe: 'Me désabonner de {{game}}',
						unsubscribed: 'Désabonné de {{game}}',
						unsubscribed_short: 'Désabonné',
					},
				},
			},
		},
	})
}
