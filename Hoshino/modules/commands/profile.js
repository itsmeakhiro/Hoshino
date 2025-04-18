/**
 * @type {HoshinoLia.Command}
 */
const command = {
    manifest: {
      name: 'profile',
      aliases: ['p', 'stats'],
      version: '1.0.0',
      developer: 'Liane Cagara',
      description: 'View or manage your profile with level, XP, and balance.',
      category: 'simulator',
      cooldown: 3,
      usage: '!profile [subcommand]',
      config: {
        admin: false,
        moderator: false,
        privateOnly: false,
      },
    },
  
    /**
     * Deploys the profile command to display or manage user stats.
     * @param {HoshinoLia.CommandContext} ctx - HoshinoLia context object.
     */
    async deploy(ctx) {
      const { chat, event, styler, fonts, hoshinoDB, LevelingSystem, BalanceHandler } = ctx;
      const username = event.senderID;
  
      const subcommands = [
        {
          subcommand: 'register',
          description: 'Register your profile (e.g., !profile register)',
          deploy: async function (/** @type {HoshinoLia.CommandContext} */ ctx) {
            const userData = await hoshinoDB.get(username);
            if (userData) {
              return chat.send('You are already registered!');
            }
  
            const leveling = new LevelingSystem();
            await leveling.register(username);
  
            const balanceHandler = new BalanceHandler({}, { username, initialBalance: 100 });
            await balanceHandler.setBalance(100, hoshinoDB);
  
            const message = styler(
              'lines1',
              `Welcome, ${fonts.bold(username)}!`,
              'Your profile has been registered.',
              'Starting Level: 1',
              'Starting XP: 0',
              'Starting Balance: 100 credits',
              'Use !profile view to see your stats.'
            );
  
            return chat.send(message);
          },
        },
        {
          subcommand: 'view',
          description: 'View your full profile (e.g., !profile view)',
          deploy: async function (/** @type {HoshinoLia.CommandContext} */ ctx) {
            const userData = await hoshinoDB.get(username);
            if (!userData) {
              return chat.send('You are not registered! Use !profile register first.');
            }
  
            const leveling = new LevelingSystem();
            await leveling.loadUserData(username);
            const levelData = leveling.export();
  
            const balanceHandler = new BalanceHandler(userData);
            const balance = await balanceHandler.getBalance(hoshinoDB);
  
            const message = styler(
              'lines1',
              `Profile for ${fonts.bold(username)}`,
              `Level: ${levelData.level}`,
              `XP: ${levelData.xp}/${levelData.xpToNextLevel}`,
              `Balance: ${balance.toLocaleString()} credits`
            );
  
            return chat.send(message);
          },
        },
        {
          subcommand: 'level',
          description: 'View your level and XP (e.g., !profile level)',
          deploy: async function (/** @type {HoshinoLia.CommandContext} */ ctx) {
            const userData = await hoshinoDB.get(username);
            if (!userData) {
              return chat.send('You are not registered! Use !profile register first.');
            }
  
            const leveling = new LevelingSystem();
            await leveling.loadUserData(username);
            const levelData = leveling.export();
  
            const message = styler(
              'lines1',
              `Level Info for ${fonts.bold(username)}`,
              `Level: ${levelData.level}`,
              `XP: ${levelData.xp}/${levelData.xpToNextLevel}`
            );
  
            return chat.send(message);
          },
        },
        {
          subcommand: 'balance',
          description: 'View your balance (e.g., !profile balance)',
          deploy: async function (/** @type {HoshinoLia.CommandContext} */ ctx) {
            const userData = await hoshinoDB.get(username);
            if (!userData) {
              return chat.send('You are not registered! Use !profile register first.');
            }
  
            const balanceHandler = new BalanceHandler(userData);
            const balance = await balanceHandler.getBalance(hoshinoDB);
  
            const message = styler(
              'lines1',
              `Balance for ${fonts.bold(username)}`,
              `${balance.toLocaleString()} credits`
            );
  
            return chat.send(message);
          },
        },
      ];
  
      const profileHandler = new ctx.HoshinoHM(subcommands, '📋');
      return profileHandler.runInContext(ctx);
    },
  };
  
  module.exports = command;
