const { cleanUserID } = global.Hoshino.utils;

const command: HoshinoLia.Command = {
  manifest: {
    name: "piratehunt",
    aliases: ["ph", "pirate"],
    version: "1.0",
    developer: "Francis Loyd Raval",
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
            const shipPrices = {
              sloop: { defense: 50, health: 100, cost: 10000 },
              brig: { defense: 100, health: 200, cost: 50000 },
              galleon: { defense: 200, health: 400, cost: 100000 },
            };
            if (!shipPrices[shipType]) {
              return await chat.reply(
                `Invalid ship type: "${shipType}". Available: sloop, brig, galleon.`
              );
            }
            const cleanID = cleanUserID(event.senderID);
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 } } = userData;
            const { cost, defense, health } = shipPrices[shipType];
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
                ships: [...pirateHuntData.ships, { type: shipType, defense, health, upgradeLevel: 1 }],
              },
            };
            await hoshinoDB.set(cleanID, updatedData);
            console.log(`User ${cleanID} bought ${shipType} for ${cost} gold`);
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
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 }, inventoryData = [] } = userData;
            if (pirateHuntData.ships.length === 0) {
              return await chat.reply(
                "You need to buy a ship first! Use: piratehunt buy <ship_type>"
              );
            }
            const sailCooldown = 3_600_000;
            if (pirateHuntData.lastSail && Date.now() < pirateHuntData.lastSail + sailCooldown) {
              const remainingMs = pirateHuntData.lastSail + sailCooldown - Date.now();
              const remainingMin = Math.ceil(remainingMs / 60000);
              return await chat.reply(
                `You can sail again in ${remainingMin} minute(s).`
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
                {
                  name: "Pearl Necklace",
                  key: "pearl_necklace",
                  type: "generic",
                  sellPrice: 400,
                  flavorText: "A string of lustrous pearls, harvested from the deep.",
                },
                {
                  name: "Diamond Crown",
                  key: "diamond_crown",
                  type: "generic",
                  sellPrice: 2000,
                  flavorText: "A regal crown encrusted with flawless diamonds.",
                },
                {
                  name: "Cursed Compass",
                  key: "cursed_compass",
                  type: "generic",
                  sellPrice: 800,
                  flavorText: "A compass that points to forbidden treasures.",
                },
                {
                  name: "Mystic Orb",
                  key: "mystic_orb",
                  type: "generic",
                  sellPrice: 1200,
                  flavorText: "An orb swirling with arcane energy.",
                },
                {
                  name: "Bronze Chalice",
                  key: "bronze_chalice",
                  type: "generic",
                  sellPrice: 250,
                  flavorText: "An ancient cup, etched with cryptic runes.",
                },
                {
                  name: "Obsidian Dagger",
                  key: "obsidian_dagger",
                  type: "generic",
                  sellPrice: 600,
                  flavorText: "A sharp blade carved from volcanic glass.",
                },
                {
                  name: "Starlight Pendant",
                  key: "starlight_pendant",
                  type: "generic",
                  sellPrice: 900,
                  flavorText: "A pendant that glows like a captured star.",
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
                {
                  name: "Gilded Coffer",
                  key: "gilded_coffer",
                  type: "chest",
                  icon: "✨",
                  flavorText: "A golden chest radiating opulence.",
                },
                {
                  name: "Abyssal Cache",
                  key: "abyssal_cache",
                  type: "chest",
                  icon: "🌊",
                  flavorText: "A chest pulled from the ocean’s darkest depths.",
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
              pirateHuntData: {
                ...pirateHuntData,
                lastSail: Date.now(),
              },
            });
            console.log(`User ${cleanID} sailed: ${message}`);
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
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 } } = userData;
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
                  injuredSoldiers: pirateHuntData.soldiers.injuredSoldiers,
                },
              },
            };
            await hoshinoDB.set(cleanID, updatedData);
            console.log(`User ${cleanID} recruited ${amount} soldiers for ${cost} gold`);
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
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 } } = userData;
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
            if (pirateHuntData.soldiers.healUntil && Date.now() < pirateHuntData.soldiers.healUntil) {
              const remainingMs = pirateHuntData.soldiers.healUntil - Date.now();
              const remainingMin = Math.ceil(remainingMs / 60000);
              return await chat.reply(
                `Your injured soldiers are still healing. Try again in ${remainingMin} minute(s).`
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
            const targetShips = targetData.pirateHuntData.ships;
            const targetDefense = targetShips.reduce((sum, ship) => sum + ship.defense, 0);
            const targetHealth = targetShips.reduce((sum, ship) => sum + ship.health, 0);
            const attackerStrength = pirateHuntData.soldiers.count * pirateHuntData.soldiers.abilityLevel * 10;
            const successChance = Math.min(0.9, attackerStrength / (attackerStrength + (targetDefense + targetHealth) * 0.75));
            const isSuccess = Math.random() < successChance;
            let message = "";
            let attackerBalance = userData.balance;
            let targetBalance = targetData.balance;
            let updatedSoldiers = { ...pirateHuntData.soldiers };
            let soldiersLost = 0;
            if (isSuccess) {
              const loot = Math.floor(targetBalance / 2);
              attackerBalance += loot;
              targetBalance -= loot;
              message = `Raid successful! You looted ${loot} gold from ${targetData.username}!`;
            } else {
              const loss = Math.floor(userData.balance / 2);
              attackerBalance -= loss;
              targetBalance += loss;
              const lossPercentage = Math.floor(Math.random() * 20) + 1;
              soldiersLost = Math.max(1, Math.floor(pirateHuntData.soldiers.count * (lossPercentage / 100)));
              updatedSoldiers.count = Math.max(1, pirateHuntData.soldiers.count - soldiersLost);
              updatedSoldiers.injuredSoldiers = (updatedSoldiers.injuredSoldiers || 0) + soldiersLost;
              updatedSoldiers.healUntil = Date.now() + 4 * 60 * 60 * 1000;
              message = `Raid failed! You lost ${loss} gold to ${targetData.username} and ${soldiersLost} soldiers (${lossPercentage}%) to injuries. Your ${updatedSoldiers.injuredSoldiers} injured soldiers need to heal for 4 hours.`;
            }
            if (updatedSoldiers.healUntil && Date.now() >= updatedSoldiers.healUntil) {
              updatedSoldiers.count += updatedSoldiers.injuredSoldiers;
              updatedSoldiers.injuredSoldiers = 0;
              updatedSoldiers.healUntil = undefined;
            }
            await hoshinoDB.set(cleanID, {
              ...userData,
              balance: attackerBalance,
              pirateHuntData: {
                ...pirateHuntData,
                soldiers: updatedSoldiers,
              },
            });
            await hoshinoDB.set(target.uid, {
              ...targetData,
              balance: targetBalance,
            });
            console.log(`Raid by ${cleanID} on ${target.uid}: ${isSuccess ? "Success" : "Failure"}, soldiers lost: ${soldiersLost}`);
            await chat.reply(message);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["enhance"],
          description: "Upgrade a ship to increase its defense and health.",
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
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 } } = userData;
            if (shipIndex >= pirateHuntData.ships.length) {
              return await chat.reply(
                `You only have ${pirateHuntData.ships.length} ship(s). Choose a valid index.`
              );
            }
            const ship = pirateHuntData.ships[shipIndex];
            const baseCost = 5000;
            const cost = baseCost * Math.pow(2, ship.upgradeLevel - 1);
            const defenseIncrease = ship.defense * 0.2;
            const healthIncrease = ship.health * 0.2;
            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to upgrade your ${ship.type}. Your balance: ${balance}.`
              );
            }
            const updatedShips = [...pirateHuntData.ships];
            updatedShips[shipIndex] = {
              ...ship,
              defense: ship.defense + defenseIncrease,
              health: ship.health + healthIncrease,
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
            console.log(`User ${cleanID} upgraded ship ${ship.type} for ${cost} gold`);
            await chat.reply(
              `Upgraded your ${ship.type} for ${cost} gold! Defense increased to ${updatedShips[shipIndex].defense.toFixed(0)}, Health increased to ${updatedShips[shipIndex].health.toFixed(0)}.`
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
            let userData = (await hoshinoDB.get(cleanID)) || {};
            if (!userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance, pirateHuntData = { ships: [], soldiers: { count: 0, abilityLevel: 1, injuredSoldiers: 0 }, lastSail: 0 } } = userData;
            if (pirateHuntData.soldiers.count === 0) {
              return await chat.reply(
                "You need soldiers to train! Use: piratehunt recruit <amount>"
              );
            }
            if (pirateHuntData.soldiers.healUntil && Date.now() < pirateHuntData.soldiers.healUntil) {
              const remainingMs = pirateHuntData.soldiers.healUntil - Date.now();
              const remainingMin = Math.ceil(remainingMs / 60000);
              return await chat.reply(
                `Your injured soldiers are still healing. Try again in ${remainingMin} minute(s).`
              );
            }
            const cost = 10000 * pirateHuntData.soldiers.abilityLevel;
            if (balance < cost) {
              return await chat.reply(
                `You need ${cost} gold to train your soldiers. Your balance: ${balance}.`
              );
            }
            let updatedSoldiers = { ...pirateHuntData.soldiers };
            if (updatedSoldiers.healUntil && Date.now() >= updatedSoldiers.healUntil) {
              updatedSoldiers.count += updatedSoldiers.injuredSoldiers;
              updatedSoldiers.injuredSoldiers = 0;
              updatedSoldiers.healUntil = undefined;
            }
            updatedSoldiers.abilityLevel = Math.min(10, updatedSoldiers.abilityLevel + 1);
            await hoshinoDB.set(cleanID, {
              ...userData,
              balance: balance - cost,
              pirateHuntData: {
                ...pirateHuntData,
                soldiers: updatedSoldiers,
              },
            });
            console.log(`User ${cleanID} trained soldiers to ability level ${updatedSoldiers.abilityLevel} for ${cost} gold`);
            await chat.reply(
              `Trained your soldiers for ${cost} gold! Ability level increased to ${updatedSoldiers.abilityLevel}.`
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
