const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();  // Importiere dotenv für Umgebungsvariablen

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Notwendig für Slash Commands
    ],
});

const token = process.env.BOT_TOKEN; // Nutze das Token aus der Umgebungsvariable
const allowedRoles = ['1075390537101737988', '1075390537101737987']; // Ersetze mit den tatsächlichen Rollen-IDs

// Speichern der Ausweisdaten und gesperrte Ausweise
let ausweisDaten = {};
let gesperrteAusweise = {};

client.once('ready', async () => {
    console.log(`Bot ist eingeloggt als ${client.user.tag}`);

    // Slash Commands registrieren
    const commands = [
        new SlashCommandBuilder()
            .setName('ausweis')
            .setDescription('Verwalte deinen Personalausweis.')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('erstellen')
                    .setDescription('Erstelle deinen Personalausweis')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('Dein Vorname')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('nachname')
                            .setDescription('Dein Nachname')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('alter')
                            .setDescription('Dein Alter')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('geburtsdatum')
                            .setDescription('Dein Geburtsdatum')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('herkunft')
                            .setDescription('Deine Herkunft')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('anzeigen')
                    .setDescription('Zeigt deinen Personalausweis an'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('sperren')
                    .setDescription('Sperrt einen Benutzer')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('Benutzer zum Sperren')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('entsperren')
                    .setDescription('Entsperrt einen Benutzer')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('Benutzer zum Entsperren')
                            .setRequired(true)))
    ];

    await client.application.commands.set(commands);
    console.log('Slash Commands wurden registriert!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;
    const member = await interaction.guild.members.fetch(userId);

    // Funktion zum Überprüfen, ob der Benutzer eine erlaubte Rolle hat
    const hasRole = allowedRoles.some(role => member.roles.cache.has(role));

    if (commandName === 'ausweis') {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'erstellen') {
            const name = interaction.options.getString('name');
            const nachname = interaction.options.getString('nachname');
            const alter = interaction.options.getString('alter');
            const geburtsdatum = interaction.options.getString('geburtsdatum');
            const herkunft = interaction.options.getString('herkunft');

            // Speichern der Ausweisdaten
            ausweisDaten[userId] = {
                name,
                nachname,
                alter,
                geburtsdatum,
                herkunft,
                gesperrt: false // Standardmäßig ist der Ausweis nicht gesperrt
            };

            await interaction.reply({
                content: `Personalausweis für ${name} ${nachname} wurde erstellt!`,
                ephemeral: true // Antwort nur für den Benutzer sichtbar
            });
        }

        if (subCommand === 'anzeigen') {
            if (gesperrteAusweise[userId]) {
                // Wenn der Ausweis gesperrt ist
                await interaction.reply({
                    content: 'Dein Ausweis wurde gesperrt. Bitte erstelle einen neuen Ausweis.',
                    ephemeral: true // Antwort nur für den Benutzer sichtbar
                });
                return;
            }

            const ausweis = ausweisDaten[userId];

            if (!ausweis) {
                await interaction.reply({
                    content: 'Du hast noch keinen Personalausweis erstellt. Benutze `/ausweis erstellen`.',
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `Dein Ausweis:
                **Name**: ${ausweis.name} ${ausweis.nachname}
                **Alter**: ${ausweis.alter}
                **Geburtsdatum**: ${ausweis.geburtsdatum}
                **Herkunft**: ${ausweis.herkunft}`,
                ephemeral: true // Antwort nur für den Benutzer sichtbar
            });
        }

        if (subCommand === 'sperren') {
            if (!hasRole) {
                await interaction.reply({
                    content: 'Du hast nicht die Berechtigung, Benutzer zu sperren.',
                    ephemeral: true
                });
                return;
            }

            const user = interaction.options.getUser('user');
            const userIdToBlock = user.id;

            // Sperren des Ausweises des Benutzers
            gesperrteAusweise[userIdToBlock] = true;

            await interaction.reply({
                content: `${user.tag} wurde gesperrt. Der Ausweis ist nun gesperrt.`,
                ephemeral: true
            });
        }

        if (subCommand === 'entsperren') {
            if (!hasRole) {
                await interaction.reply({
                    content: 'Du hast nicht die Berechtigung, Benutzer zu entsperren.',
                    ephemeral: true
                });
                return;
            }

            const user = interaction.options.getUser('user');
            const userIdToUnblock = user.id;

            // Entsperren des Ausweises des Benutzers
            delete gesperrteAusweise[userIdToUnblock];

            await interaction.reply({
                content: `${user.tag} wurde entsperrt. Der Ausweis ist jetzt wieder verfügbar.`,
                ephemeral: true
            });
        }
    }
});

client.login(token);
