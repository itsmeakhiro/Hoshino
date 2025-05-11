const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "piratehunt",
    aliases: ["ph", "pirate"],
    version: "1.0",
    developer: "Francis And Liane",
    description: "Sail the seas as a pirate: buy ships, scavenge chests, recruit soldiers, raid users, upgrade ships, and train soldiers.",
    category: "RPG",
    usage:
      "piratehunt buy <ship_type> | piratehunt sail | piratehunt recruit <amount> | piratehunt raid | piratehunt upgrade <ship_index> | piratehunt train",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🏴‍☠️ 〙 PIRATE HUNT",
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
          description: "Buy a ship to start your pirate adventure.",
          usage: "piratehunt buy <ship_type>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 2) {
              return await chat.reply(
                "Please provide a ship type (sloop, brig, galleon). Usage: piratehunt buy <ship_type>"
              );
            }
            const shipType = args[1]
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim()
              .replace(/[^a-z]/g, "");
            console.log("Debug: shipType =", JSON.stringify(shipType));

            const shipPrices: Record<string, { defense: number; cost: number }> = {
              sloop: { defense: 50, cost: 10000 },
              brig: { defense: 100, cost: 50000 },
              galleon: { defense: 200, cost: 100000 },
            };

            if (!shipPrices[shipType]) {
              return await chat.reply(
                `Invalid ship type: "${shipType}". Available: sloop, brig, galleon.`
              );
            }

            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } } } = userData;
            const { cost, defense } = shipPrices[shipType];

            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to buy a ${shipType}. Your balance: ${balance}.`
              );
            }

            const updatedData = {
              ...userData,
              balance: balance - cost,
              pirateHuntData: {
                ...pirateHuntData,
                ships: [...pirateHuntData.ships, { type: shipType, defense, upgradeLevel: 1 }],
              },
            };

            await hoshinoDB.set(cleanID, updatedData);
            await chat.reply(
              `You bought a ${shipType} for ${cost} gold! Ready to set sail.`
            );
          },
        },
        {
          subcommand: "sail",
          aliases: ["scavenge"],
          description: "Set sail to scavenge for treasure chests.",
          usage: "piratehunt sail",
          async deploy({ chat, event, hoshinoDB, Inventory }) {
            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } }, inventoryData = [] } = userData;
            if (pirateHuntData.ships.length === 0) {
              return await chat.reply(
                "You need to buy a ship first! Use: piratehunt buy <ship_type>"
              );
            }

            const inventory = new Inventory(inventoryData);
            const outcome = Math.random();
            let message = "";
            if (outcome < 0.3) {
              const treasures = [
                {
                  name: "Gold Coin",
                  key: "gold_coin",
                  type: "generic",
                  sellPrice: 100,
                  flavorText: "A shiny coin, coveted by all pirates.",
                },
                {
                  name: "Sapphire Gem",
                  key: "sapphire_gem",
                  type: "generic",
                  sellPrice: 500,
                  flavorText: "A deep blue gem, glowing with inner light.",
                },
                {
                  name: "Ancient Relic",
                  key: "ancient_relic",
                  type: "generic",
                  sellPrice: 1000,
                  flavorText: "An artifact from a long-forgotten civilization.",
                },
                {
                  name: "Emerald Ring",
                  key: "emerald_ring",
                  type: "generic",
                  sellPrice: 300,
                  flavorText: "A ring sparkling with forbidden allure.",
                },
                {
                  name: "Silver Doubloon",
                  key: "silver_doubloon",
                  type: "generic",
                  sellPrice: 150,
                  flavorText: "A pirate’s coin, heavy with tales of plunder.",
                },
                {
                  name: "Ruby Amulet",
                  key: "ruby_amulet",
                  type: "generic",
                  sellPrice: 700,
                  flavorText: "A blood-red amulet, pulsing with mystery.",
                },
                {
                  name: "Golden Idol",
                  key: "golden_idol",
                  type: "generic",
                  sellPrice: 1500,
                  flavorText: "A statue gleaming with cursed splendor.",
                },
              ];

              const chests = [
                {
                  name: "Treasure Chest",
                  key: "treasure_chest",
                  type: "chest",
                  icon: "📦",
                  flavorText: "A weathered chest, lost to the tides of time.",
                },
                {
                  name: "Pirate’s Trove",
                  key: "pirate_trove",
                  type: "chest",
                  icon: "💰",
                  flavorText: "A hoard stashed by a notorious pirate captain.",
                },
                {
                  name: "Sunken Reliquary",
                  key: "sunken_reliquary",
                  type: "chest",
                  icon: "🗝️",
                  flavorText: "A sacred chest, reclaimed from the ocean’s depths.",
                },
              ];

              const selectedChest = chests[Math.floor(Math.random() * chests.length)];
              const selectedTreasure = treasures[Math.floor(Math.random() * treasures.length)];

              const chest = {
                ...selectedChest,
                contents: [selectedTreasure],
              };

              inventory.addOne(chest);
              message = `You found a ${selectedChest.name}!`;
            } else {
              message = "You sailed but found nothing. Try again!";
            }

            await hoshinoDB.set(cleanID, {
              ...userData,
              inventoryData: inventory.raw(),
            });

            await chat.reply(message);
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire"],
          description: "Recruit soldiers for raiding.",
          usage: "piratehunt recruit <amount>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1) {
              return await chat.reply(
                "Please provide the number of soldiers to recruit. Usage: piratehunt recruit <amount>"
              );
            }
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount < 1) {
              return await chat.reply("Amount must be a positive number.");
            }

            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } } } = userData;
            const cost = amount * 1000;

            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to recruit ${amount} soldiers. Your balance: ${balance}.`
              );
            }

            const updatedData = {
              ...userData,
              balance: balance - cost,
              pirateHuntData: {
                ...pirateHuntData,
                soldiers: {
                  count: pirateHuntData.soldiers.count + amount,
                  abilityLevel: pirateHuntData.soldiers.abilityLevel,
                },
              },
            };

            await hoshinoDB.set(cleanID, updatedData);
            await chat.reply(
              `You recruited ${amount} soldiers for ${cost} gold! Ready for a raid.`
            );
          },
        },
        {
          subcommand: "raid",
          aliases: ["attack"],
          description: "Raid a random user’s ships for gold.",
          usage: "piratehunt raid",
          async deploy({ chat, event, hoshinoDB }) {
            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } } } = userData;
            if (pirateHuntData.ships.length === 0) {
              return await chat.reply(
                "You need a ship to raid! Use: piratehunt buy <ship_type>"
              );
            }
            if (pirateHuntData.soldiers.count === 0) {
              return await chat.reply(
                "You need soldiers to raid! Use: piratehunt recruit <amount>"
              );
            }

            const allUsers = await hoshinoDB.getAll();
            const validTargets = Object.entries(allUsers)
              .filter(([uid, data]) => uid !== cleanID && data.pirateHuntData?.ships?.length > 0)
              .map(([uid, data]) => ({ uid, data }));

            if (validTargets.length === 0) {
              return await chat.reply("No valid targets to raid. Try again later!");
            }

            const target = validTargets[Math.floor(Math.random() * validTargets.length)];
            const targetData = target.data;
            const targetShips = targetData.pirateHuntData!.ships;
            const targetDefense = targetShips.reduce((sum: number, ship: any) => sum + ship.defense, 0);
            const attackerStrength = pirateHuntData.soldiers.count * pirateHuntData.soldiers.abilityLevel * 10;

            const successChance = attackerStrength / (attackerStrength + targetDefense);
            const isSuccess = Math.random() < successChance;

            let message = "";
            let attackerBalance = userData.balance;
            let targetBalance = targetData.balance;

            if (isSuccess) {
              const loot = Math.min(5000, targetBalance);
              attackerBalance += loot;
              targetBalance -= loot;
              message = `Raid successful! You looted ${loot} gold from ${targetData.username}!`;
            } else {
              const loss = Math.min(1000, userData.balance);
              attackerBalance -= loss;
              message = `Raid failed! You lost ${loss} gold in the attempt against ${targetData.username}.`;
            }

            await hoshinoDB.set(cleanID, {
              ...userData,
              balance: attackerBalance,
            });

            await hoshinoDB.set(target.uid, {
              ...targetData,
              balance: targetBalance,
            });

            await chat.reply(message);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["enhance"],
          description: "Upgrade a ship to increase its defense.",
          usage: "piratehunt upgrade <ship_index>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1) {
              return await chat.reply(
                "Please provide the ship index. Usage: piratehunt upgrade <ship_index>"
              );
            }
            const shipIndex = parseInt(args[0]) - 1;
            if (isNaN(shipIndex) || shipIndex < 0) {
              return await chat.reply("Invalid ship index. Must be a positive number.");
            }

            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } } } = userData;
            if (shipIndex >= pirateHuntData.ships.length) {
              return await chat.reply(
                `You only have ${pirateHuntData.ships.length} ship(s). Choose a valid index.`
              );
            }

            const ship = pirateHuntData.ships[shipIndex];
            const baseCost = 5000;
            const cost = baseCost * Math.pow(2, ship.upgradeLevel - 1);
            const defenseIncrease = ship.defense * 0.2;

            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to upgrade your ${ship.type}. Your balance: ${balance}.`
              );
            }

            const updatedShips = [...pirateHuntData.ships];
            updatedShips[shipIndex] = {
              ...ship,
              defense: ship.defense + defenseIncrease,
              upgradeLevel: ship.upgradeLevel + 1,
            };

            const updatedData = {
              ...userData,
              balance: balance - cost,
              pirateHuntData: {
                ...pirateHuntData,
                ships: updatedShips,
              },
            };

            await hoshinoDB.set(cleanID, updatedData);
            await chat.reply(
              `Upgraded your ${ship.type} for ${cost} gold! Defense increased to ${updatedShips[shipIndex].defense.toFixed(0)}.`
            );
          },
        },
        {
          subcommand: "train",
          aliases: ["improve"],
          description: "Train your soldiers to increase their ability level.",
          usage: "piratehunt train",
          async deploy({ chat, event, hoshinoDB }) {
            const cleanID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(cleanID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }

            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1 } } } = userData;
            if (pirateHuntData.soldiers.count === 0) {
              return await chat.reply(
                "You need soldiers to train! Use: piratehunt recruit <amount>"
              );
            }

            const cost = 10000;
            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to train your soldiers. Your balance: ${balance}.`
              );
            }

            const updatedData = {
              ...userData,
              balance: balance - cost,
              pirateHuntData: {
                ...pirateHuntData,
                soldiers: {
                  count: pirateHuntData.soldiers.count,
                  abilityLevel: pirateHuntData.soldiers.abilityLevel + 1 | 0,
                },
              },
            };

            await hoshinoDB.set(cleanID, updatedData);
            await chat.reply(
              `Trained your soldiers for ${cost} gold! Ability level increased to ${updatedData.pirateHuntData.soldiers.abilityLevel}.`
            );
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
