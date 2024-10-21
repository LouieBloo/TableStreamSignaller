const axios = require('axios')

const DISCORD_TOKEN = '123';
const CLIENT_ID = '123';

const commands = [
  {
    name: 'create_game',
    description: 'Creates a new game in Table Stream',
    options: [
      {
        name: 'room_name',
        description: 'The name of the room to create',
        type: 3,
        required: true,
      },
      {
        name: 'game_type',
        description: 'The type of game to create',
        type: 3,
        required: true,
        choices: [
          {
            name: 'MTGCommander',
            value: 'MTGCommander',
          },
          {
            name: 'MTGStandard',
            value: 'MTGStandard',
          },
          {
            name: 'MTGModern',
            value: 'MTGModern',
          },
          {
            name: 'MTGLegacy',
            value: 'MTGLegacy',
          },
          {
            name: 'MTGVintage',
            value: 'MTGVintage',
          },
        ],
      },
      {
        name: 'max_players',
        description: 'Maximum number of players',
        type: 4, 
        required: false,
      },
      {
        name: 'password',
        description: 'The room password (optional)',
        type: 3,
        required: false,
      },
    ],
  },
  // Add more commands as needed
];



const registerGlobalCommands = async () => {
  try {
    const url = `https://discord.com/api/v10/applications/${CLIENT_ID}/commands`;

    const response = await axios.post(url, commands[0], {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    });

    console.log('Global commands registered:', response.data);
  } catch (error) {
    console.error('Error registering global commands:',JSON.stringify(error.response?.data || error.message));
  }
};


const deleteGlobalCommands = async () => {
  try {
    // Fetch all global commands
    const getUrl = `https://discord.com/api/v10/applications/${CLIENT_ID}/commands`;
    const getResponse = await axios.get(getUrl, {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    });

    const commands = getResponse.data;
    console.log(`Found ${commands.length} global commands.`);

    // Iterate over the commands and delete each one
    for (const command of commands) {
      const deleteUrl = `https://discord.com/api/v10/applications/${CLIENT_ID}/commands/${command.id}`;
      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
      });
      console.log(`Deleted command: ${command.name}`);
    }

    console.log('All global commands deleted successfully.');
  } catch (error) {
    console.error('Error deleting global commands:', error.response?.data || error.message);
  }
};

//deleteGlobalCommands();

registerGlobalCommands();