/**
 * @type {HoshinoLia.Command}
 */

import crypto from 'crypto';

const command = {
  manifest: {
    name: "sabong",
    aliases: ["roosterfight"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description: "Manage and battle digital roosters in a fun, cruelty-free game.",
    category: "Game",
    usage:
      "sabong buy | sabong uncage <index> | sabong feed | sabong breed <index1> <index2> | sabong trade <username> <index> | sabong battle <bet>",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🐓 〙 SABONG",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "buy",
          aliases: ["purchase"],
          description: "Buy a random rooster with unique breed and abilities.",
          usage: "sabong buy",
          async deploy({ chat, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const breeds = ["Asil", "Kelso", "Claret", "Shamo", "Malay"];
            const abilities = ["Speed", "Strength", "Agility", "Endurance", "Precision"];
            const power = Math.floor(Math.random() * 100) + 1; 
            const price = 100000 + power * 10000; 
            if (userData.balance < price) {
              return await chat.reply(
                `You need $${price.toLocaleString()} to buy this rooster!`
              );
            }
            const rooster = {
              id: crypto.randomBytes(8).toString('hex'),
              breed: breeds[Math.floor(Math.random() * breeds.length)],
              ability: abilities[Math.floor(Math.random() * abilities.length)],
              power,
            };
            const roosters = userData.roosters || [];
            roosters.push(rooster);
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - price,
              roosters,
            });
            await chat.reply(
              `Bought a ${rooster.breed} rooster with ${rooster.ability} ability (Power: ${rooster.power}) for $${price.toLocaleString()}!`
            );
          },
        },
        {
          subcommand: "uncage",
          aliases: ["claim"],
          description: "Set a rooster as your active fighter.",
          usage: "sabong uncage <index>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.roosters || userData.roosters.length === 0) {
              return await chat.reply("You don't own any roosters! Use: sabong buy");
            }
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= userData.roosters.length) {
              return await chat.reply(
                `Invalid rooster index. You have ${userData.roosters.length} roosters.`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              activeRooster: index,
            });
            const rooster = userData.roosters[index];
            await chat.reply(
              `Uncaged your ${rooster.breed} rooster with ${rooster.ability} ability as your active fighter!`
            );
          },
        },
        {
          subcommand: "feed",
          aliases: ["train"],
          description: "Feed your active rooster to gain 20 XP for yourself.",
          usage: "sabong feed",
          async deploy({ chat, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.roosters || userData.roosters.length === 0) {
              return await chat.reply("You don't own any roosters! Use: sabong buy");
            }
            if (userData.activeRooster == null) {
              return await chat.reply("You need to uncage a rooster first! Use: sabong uncage <index>");
            }
            const rooster = userData.roosters[userData.activeRooster];
            const exp = new HoshinoEXP(userData.expData || { exp: 0, mana: 100, health: 100 });
            exp.expControls.raise(20); 
            await hoshinoDB.set(event.senderID, {
              ...userData,
              expData: exp.raw(),
            });
            await chat.reply(
              `Fed your ${rooster.breed} rooster! You gained 20 XP and are now level ${exp.getLevel()}.`
            );
          },
        },
        {
          subcommand: "breed",
          aliases: ["mate"],
          description: "Breed two roosters to create a new one with combined traits.",
          usage: "sabong breed <index1> <index2>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.roosters || userData.roosters.length < 2) {
              return await chat.reply("You need at least two roosters to breed!");
            }
            const index1 = parseInt(args[0]) - 1;
            const index2 = parseInt(args[1]) - 1;
            if (
              isNaN(index1) ||
              isNaN(index2) ||
              index1 < 0 ||
              index2 < 0 ||
              index1 >= userData.roosters.length ||
              index2 >= userData.roosters.length ||
              index1 === index2
            ) {
              return await chat.reply(
                `Invalid rooster indices. You have ${userData.roosters.length} roosters.`
              );
            }
            const rooster1 = userData.roosters[index1];
            const rooster2 = userData.roosters[index2];
            const breeds = ["Asil", "Kelso", "Claret", "Shamo", "Malay"];
            const abilities = ["Speed", "Strength", "Agility", "Endurance", "Precision"];
            const newRooster = {
              id: crypto.randomBytes(8).toString('hex'),
              breed: breeds[Math.floor(Math.random() * breeds.length)],
              ability: Math.random() < 0.5 ? rooster1.ability : rooster2.ability,
              power: Math.floor((rooster1.power + rooster2.power) / 2 * (0.8 + Math.random() * 0.4)), // 80-120% of average
            };
            const roosters = userData.roosters;
            roosters.push(newRooster);
            await hoshinoDB.set(event.senderID, {
              ...userData,
              roosters,
            });
            await chat.reply(
              `Bred a new ${newRooster.breed} rooster with ${newRooster.ability} ability (Power: ${newRooster.power})!`
            );
          },
        },
        {
          subcommand: "trade",
          aliases: ["swap"],
          description: "Trade a rooster with another player by username.",
          usage: "sabong trade <username> <index>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.roosters || userData.roosters.length === 0) {
              return await chat.reply("You don't own any roosters! Use: sabong buy");
            }
            if (args.length < 2) {
              return await chat.reply(
                "Please provide a username and rooster index. Usage: sabong trade <username> <index>"
              );
            }
            const targetUsername = args.slice(0, -1).join(" ").trim();
            const index = parseInt(args[args.length - 1]) - 1;
            if (isNaN(index) || index < 0 || index >= userData.roosters.length) {
              return await chat.reply(
                `Invalid rooster index. You have ${userData.roosters.length} roosters.`
              );
            }
            const allUsers = await hoshinoDB.getAll();
            let targetUID = null;
            for (const [uid, data] of Object.entries(allUsers)) {
              if (data.username === targetUsername && uid !== event.senderID) {
                targetUID = uid;
                break;
              }
            }
            if (!targetUID) {
              return await chat.reply(`User ${targetUsername} not found or invalid.`);
            }
            const targetData = await hoshinoDB.get(targetUID);
            if (!targetData.roosters || targetData.roosters.length === 0) {
              return await chat.reply(`${targetUsername} has no roosters to trade.`);
            }
            const userRooster = userData.roosters[index];
            const targetRooster = targetData.roosters[Math.floor(Math.random() * targetData.roosters.length)];
            const userRoosters = userData.roosters.filter((_, i) => i !== index);
            userRoosters.push(targetRooster);
            const targetRoosters = targetData.roosters.filter(r => r.id !== targetRooster.id);
            targetRoosters.push(userRooster);
            await hoshinoDB.set(event.senderID, {
              ...userData,
              roosters: userRoosters,
              activeRooster: userData.activeRooster === index ? null : userData.activeRooster,
            });
            await hoshinoDB.set(targetUID, {
              ...targetData,
              roosters: targetRoosters,
            });
            await chat.reply(
              `Traded your ${userRooster.breed} rooster for ${targetUsername}'s ${targetRooster.breed} rooster!`
            );
          },
        },
        {
          subcommand: "battle",
          aliases: ["fight"],
          description: "Battle your rooster against a random player's with a bet.",
          usage: "sabong battle <bet>",
          async deploy({ chat, args, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.roosters || userData.roosters.length === 0) {
              return await chat.reply("You don't own any roosters! Use: sabong buy");
            }
            if (userData.activeRooster == null) {
              return await chat.reply("You need to uncage a rooster first! Use: sabong uncage <index>");
            }
            const bet = parseInt(args[0]);
            if (isNaN(bet) || bet <= 0) {
              return await chat.reply("Please provide a valid bet amount. Usage: sabong battle <bet>");
            }
            if (userData.balance < bet) {
              return await chat.reply(`You don't have enough balance for a ${bet.toLocaleString()} bet!`);
            }
            const allUsers = await hoshinoDB.getAll();
            const validOpponents = Object.entries(allUsers).filter(
              ([uid, data]) =>
                uid !== event.senderID &&
                data.roosters &&
                data.roosters.length > 0 &&
                data.activeRooster != null
            );
            if (validOpponents.length === 0) {
              return await chat.reply("No opponents with active roosters found!");
            }
            const [opponentUID, opponentData] = validOpponents[Math.floor(Math.random() * validOpponents.length)];
            const userRooster = userData.roosters[userData.activeRooster];
            const opponentRooster = opponentData.roosters[opponentData.activeRooster];
            const userExp = new HoshinoEXP(userData.expData || { exp: 0, mana: 100, health: 100 });
            const opponentExp = new HoshinoEXP(opponentData.expData || { exp: 0, mana: 100, health: 100 });
            const userPower = userRooster.power + userExp.getLevel() * 10;
            const opponentPower = opponentRooster.power + opponentExp.getLevel() * 10;
            const powerDiff = (userPower - opponentPower) / (userPower + opponentPower); 
            const winChance = 0.5 + powerDiff * 0.5; 
            const userWins = Math.random() < winChance;
            const userDiamonds = Math.floor(Math.random() * 100) + 1; 
            const opponentDiamonds = Math.floor(Math.random() * 100) + 1; 
            let message;
            if (userWins) {
              userExp.expControls.raise(50); 
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: userData.balance + bet * 2, 
                diamonds: (userData.diamonds || 0) + userDiamonds + opponentDiamonds,
                expData: userExp.raw(),
              });
              await hoshinoDB.set(opponentUID, {
                ...opponentData,
                balance: opponentData.balance - bet,
              });
              message = [
                `Your ${userRooster.breed} rooster defeated ${opponentData.username}'s ${opponentRooster.breed} rooster!`,
                `You won $${(bet * 2).toLocaleString()}, ${userDiamonds + opponentDiamonds} diamonds, and 50 XP.`,
                `You are now level ${userExp.getLevel()}.`
              ].join("\n");
            } else {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: userData.balance - bet,
                expData: userExp.raw(),
              });
              await hoshinoDB.set(opponentUID, {
                ...opponentData,
                balance: opponentData.balance + bet * 2,
                diamonds: (opponentData.diamonds || 0) + userDiamonds + opponentDiamonds,
              });
              message = [
                `${opponentData.username}'s ${opponentRooster.breed} rooster defeated your ${userRooster.breed} rooster!`,
                `You lost your $${bet.toLocaleString()} bet.`
              ].join("\n");
            }
            await chat.reply(message);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
