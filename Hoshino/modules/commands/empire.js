/**
 * @type {HoshinoLia.Command}
 */

const command = {
  manifest: {
    name: "empire",
    aliases: ["emp"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "A simulation game where you build an empire by buying land, recruiting workers and soldiers, earning money, training soldiers, upgrading your castle, conquering others, and rebuilding damaged castles.",
    category: "Simulation",
    usage:
      "empire buy | empire recruit <worker|soldier> | empire work | empire collect | empire train | empire status | empire upgrade | empire conquer | empire rebuild",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🏰 〙 EMPIRE",
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
          aliases: ["purchase", "land"],
          description: "Attempt to buy land to start your empire (50% chance).",
          usage: "empire buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.empire && userData.empire.hasLand) {
              return await chat.reply("You already own land!");
            }
            const success = Math.random() < 0.5;
            if (!success) {
              return await chat.reply(
                "Failed to find suitable land. Try again!"
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: {
                hasLand: true,
                castle: { health: 100, defense: 10, level: 1 },
                workers: [],
                soldiers: [],
                earnings: 0,
                lastWork: 0,
                lastConquer: 0,
                rebuildProgress: 0,
                lastRebuild: 0,
              },
              exp: { exp: 0, mana: 100, health: 100 },
            });
            await chat.reply(
              "You successfully bought land and built a weak castle!"
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire"],
          description: "Recruit a worker or soldier (max 5 total).",
          usage: "empire recruit <worker|soldier>",
          async deploy({ chat, args, event, hoshinoDB }) {
            if (args.length < 1) {
              return await chat.reply(
                "Specify what to recruit. Usage: empire recruit <worker|soldier>"
              );
            }
            const type = (args[0].toLowerCase() === "recruit" ? args[1] : args[0]).toLowerCase();
            if (!["worker", "soldier"].includes(type)) {
              return await chat.reply(
                "Invalid type! Use: empire recruit <worker|soldier>"
              );
            }
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            const { workers = [], soldiers = [] } = userData.empire;
            if (workers.length + soldiers.length >= 5) {
              return await chat.reply(
                "You have reached the maximum of 5 recruits!"
              );
            }
            const recruit = {
              level: 1,
              equipment: { armor: "leather", weapon: "wooden", level: 1 },
            };
            if (type === "worker") {
              workers.push(recruit);
            } else {
              soldiers.push({ ...recruit, strength: 10, agility: 10, endurance: 10 });
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: { ...userData.empire, workers, soldiers },
            });
            await chat.reply(`Successfully recruited a ${type}!`);
          },
        },
        {
          subcommand: "work",
          aliases: ["earn"],
          description: "Start workers to earn money every 30 minutes.",
          usage: "empire work",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.workers.length === 0) {
              return await chat.reply(
                "You need at least one worker! Use: empire recruit worker"
              );
            }
            const now = Date.now();
            const lastWork = userData.empire.lastWork || 0;
            if (now - lastWork < 30 * 60 * 1000) {
              const remaining = Math.ceil((30 * 60 * 1000 - (now - lastWork)) / 60000);
              return await chat.reply(
                `Workers are still working. Check back in ${remaining} minutes.`
              );
            }
            const earnings = userData.empire.workers.length * 100;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: {
                ...userData.empire,
                earnings: (userData.empire.earnings || 0) + earnings,
                lastWork: now,
              },
            });
            await chat.reply(
              `Your ${userData.empire.workers.length} worker(s) earned $${earnings}! Use 'empire collect' to claim.`
            );
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim"],
          description: "Collect all earnings from workers.",
          usage: "empire collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            const earnings = userData.empire.earnings || 0;
            if (earnings === 0) {
              return await chat.reply("No earnings to collect!");
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: (userData.balance || 0) + earnings,
              empire: { ...userData.empire, earnings: 0 },
            });
            await chat.reply(`Collected $${earnings} from your empire!`);
          },
        },
        {
          subcommand: "train",
          aliases: ["practice"],
          description: "Train soldiers to improve strength, agility, and endurance.",
          usage: "empire train",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.soldiers.length === 0) {
              return await chat.reply(
                "You need at least one soldier! Use: empire recruit soldier"
              );
            }
            const soldiers = userData.empire.soldiers.map((soldier) => ({
              ...soldier,
              strength: soldier.strength + 2,
              agility: soldier.agility + 2,
              endurance: soldier.endurance + 2,
              level: soldier.level + 1,
            }));
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: { ...userData.empire, soldiers },
            });
            await chat.reply(
              `Your ${soldiers.length} soldier(s) trained and gained +2 strength, agility, endurance, and +1 level!`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["stats", "info"],
          description: "Check your empire's earnings, castle, soldier status, and rebuild progress.",
          usage: "empire status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            const { castle, workers, soldiers, earnings = 0, rebuildProgress = 0, lastRebuild = 0 } = userData.empire;
            const maxHealth = 100 + (castle.level - 1) * 20;
            const userExp = new HoshinoEXP(userData.exp || { exp: 0, mana: 100, health: 100 });
            const statusInfo = [
              `Castle: Level ${castle.level}, Health ${castle.health}/${maxHealth}, Defense ${castle.defense}`,
              `Workers: ${workers.length} (Level ${workers[0]?.level || 1})`,
              `Soldiers: ${soldiers.length} (Level ${soldiers[0]?.level || 1})`,
              `Pending Earnings: $${earnings.toLocaleString("en-US")}`,
              soldiers.length > 0
                ? `Soldier Stats: Strength ${soldiers[0].strength}, Agility ${soldiers[0].agility}, Endurance ${soldiers[0].endurance}`
                : "No soldiers recruited.",
              rebuildProgress > 0
                ? `Rebuild Progress: ${(rebuildProgress * 100).toFixed(1)}%`
                : castle.health < maxHealth
                ? "Castle damaged! Use 'empire rebuild' to repair."
                : "Castle at full health.",
              `EXP: ${userExp.getEXP()}, Level: ${userExp.getLevel()}, Rank: ${userExp.getRankString()}`,
            ].join("\n");
            await chat.reply(statusInfo);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["improve"],
          description: "Upgrade your castle to increase health and defense (costs 1000).",
          usage: "empire upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if ((userData.balance || 0) < 1000) {
              return await chat.reply(
                "You need 1,000 to upgrade your castle!"
              );
            }
            const castle = userData.empire.castle;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - 1000,
              empire: {
                ...userData.empire,
                castle: {
                  ...castle,
                  level: castle.level + 1,
                  health: castle.health + 20,
                  defense: castle.defense + 5,
                },
              },
            });
            await chat.reply(
              `Castle upgraded to level ${castle.level + 1}! +20 health, +5 defense. 1,000 deducted.`
            );
          },
        },
        {
          subcommand: "conquer",
          aliases: ["raid"],
          description: "Attempt to conquer another player's castle (50% chance, 30-min cooldown).",
          usage: "empire conquer",
          async deploy({ chat, event, hoshinoDB, HoshinoEXP }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.soldiers.length === 0) {
              return await chat.reply(
                "You need at least one soldier! Use: empire recruit soldier"
              );
            }
            const now = Date.now();
            const lastConquer = userData.empire.lastConquer || 0;
            if (now - lastConquer < 30 * 60 * 1000) {
              const remaining = Math.ceil((30 * 60 * 1000 - (now - lastConquer)) / 60000);
              return await chat.reply(
                `You must wait ${remaining} minutes before conquering again.`
              );
            }
            const allUsers = await hoshinoDB.getAll();
            const otherUsers = Object.entries(allUsers).filter(
              ([uid, data]) =>
                uid !== event.senderID &&
                data.empire &&
                data.empire.hasLand &&
                data.empire.castle.health > 0
            );
            if (otherUsers.length === 0) {
              return await chat.reply("No other user joined the game yet.");
            }
            const [targetUID, targetData] = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            const success = Math.random() < 0.5;
            const randomDiamonds = Math.floor(Math.random() * 5) + 1;
            const userExp = new HoshinoEXP(userData.exp || { exp: 0, mana: 100, health: 100 });
            const targetExp = new HoshinoEXP(targetData.exp || { exp: 0, mana: 100, health: 100 });
            if (success) {
              const loot = Math.floor((targetData.balance || 0) * 0.5);
              userExp.raise(50);
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: (userData.balance || 0) + loot,
                diamonds: (userData.diamonds || 0) + randomDiamonds,
                empire: { ...userData.empire, lastConquer: now },
                exp: userExp.raw(),
              });
              await hoshinoDB.set(targetUID, {
                ...targetData,
                empire: {
                  ...targetData.empire,
                  castle: {
                    ...targetData.empire.castle,
                    health: Math.max(0, targetData.empire.castle.health - 20),
                  },
                  soldiers: targetData.empire.soldiers.slice(1),
                },
                balance: Math.max(0, (targetData.balance || 0) - loot),
                exp: targetExp.raw(),
              });
              await chat.reply(
                `You conquered ${targetData.username}'s castle! Gained $${loot}, 💎${randomDiamonds}, and 50 EXP. Their castle lost 20 health and 1 soldier.`
              );
            } else {
              const expToLose = Math.min(userExp.getEXP(), 20);
              userExp.decrease(expToLose);
              targetExp.raise(expToLose);
              await hoshinoDB.set(event.senderID, {
                ...userData,
                empire: {
                  ...userData.empire,
                  castle: {
                    ...userData.empire.castle,
                    health: Math.max(0, userData.empire.castle.health - 20),
                  },
                  soldiers: userData.empire.soldiers.slice(1),
                  lastConquer: now,
                },
                balance: 0,
                exp: userExp.raw(),
              });
              await hoshinoDB.set(targetUID, {
                ...targetData,
                balance: (targetData.balance || 0) + (userData.balance || 0),
                diamonds: (targetData.diamonds || 0) + randomDiamonds,
                exp: targetExp.raw(),
              });
              await chat.reply(
                `You failed to conquer ${targetData.username}'s castle! Your castle lost 20 health, 1 soldier, all money, and ${expToLose} EXP. They gained 💎${randomDiamonds} and ${expToLose} EXP.`
              );
            }
          },
        },
        {
          subcommand: "rebuild",
          aliases: ["repair"],
          description: "Rebuild your damaged castle using workers (faster with higher-level workers).",
          usage: "empire rebuild",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.workers.length === 0) {
              return await chat.reply(
                "You need at least one worker to rebuild! Use: empire recruit worker"
              );
            }
            const { castle, workers, rebuildProgress = 0, lastRebuild = 0 } = userData.empire;
            const maxHealth = 100 + (castle.level - 1) * 20;
            if (castle.health >= maxHealth) {
              return await chat.reply("Your castle is already at full health!");
            }
            const avgWorkerLevel = workers.reduce((sum, w) => sum + w.level, 0) / workers.length;
            const baseRebuildTime = Math.max(15, 60 - (avgWorkerLevel - 1) * 5) * 60 * 1000;
            const now = Date.now();
            const elapsed = now - lastRebuild;
            const progressIncrement = elapsed / baseRebuildTime;
            const newProgress = Math.min(1, rebuildProgress + progressIncrement);
            const healthToRestore = (maxHealth - castle.health) * newProgress;
            const newHealth = Math.min(maxHealth, castle.health + Math.floor(healthToRestore));
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: {
                ...userData.empire,
                castle: { ...castle, health: newHealth },
                rebuildProgress: newHealth >= maxHealth ? 0 : newProgress,
                lastRebuild: now,
              },
            });
            if (newHealth >= maxHealth) {
              await chat.reply("Your castle has been fully rebuilt!");
            } else {
              const remainingTime = Math.ceil(((1 - newProgress) * baseRebuildTime) / 60000);
              await chat.reply(
                `Rebuilding in progress. Castle health: ${newHealth}/${maxHealth}. Check back in ${remainingTime} minutes.`
              );
            }
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
