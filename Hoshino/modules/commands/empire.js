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
      "A simulation game where you build an empire by buying land, recruiting workers and random soldiers (Normal, Archer, Berserker), earning money, training workers and soldiers, upgrading your castle to increase occupancy and stats, conquering others with your entire army, and rebuilding damaged castles.",
    category: "Simulation",
    usage:
      "empire buy | empire recruit | empire work | empire collect | empire train | empire status | empire upgrade | empire conquer | empire rebuild",
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
                lastTrain: 0,
                recruitLimit: 5, 
                upgradeCost: 100000000, 
              },
            });
            await chat.reply(
              "You successfully bought land and built a weak castle!"
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire"],
          description: "Recruit one worker and one random soldier (Normal, Archer, Berserker).",
          usage: "empire recruit",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            const { workers = [], soldiers = [], recruitLimit = 5 } = userData.empire;
            if (workers.length + soldiers.length + 2 > recruitLimit) {
              return await chat.reply(
                `You need ${2 - (recruitLimit - (workers.length + soldiers.length))} more slot(s)! Upgrade your castle to increase occupancy (current limit: ${recruitLimit}).`
              );
            }
            const worker = {
              level: 1,
              equipment: { armor: "leather", weapon: "wooden", level: 1 },
            };
            workers.push(worker);
            const soldierTypes = [
              { type: "normal", strength: 10, agility: 10, endurance: 10 },
              { type: "archer", strength: 5, agility: 15, endurance: 8 },
              { type: "berserker", strength: 15, agility: 8, endurance: 5 },
            ];
            const randomSoldier = soldierTypes[Math.floor(Math.random() * soldierTypes.length)];
            const soldier = {
              level: 1,
              equipment: { armor: "leather", weapon: "wooden", level: 1 },
              type: randomSoldier.type,
              strength: randomSoldier.strength,
              agility: randomSoldier.agility,
              endurance: randomSoldier.endurance,
            };
            soldiers.push(soldier);
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: { ...userData.empire, workers, soldiers },
            });
            await chat.reply(`Recruited 1 worker and 1 ${randomSoldier.type} soldier!`);
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
                "You need at least one worker! Use: empire recruit"
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
          description: "Train workers and soldiers to improve their levels (24-hour cooldown).",
          usage: "empire train",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.workers.length === 0 && userData.empire.soldiers.length === 0) {
              return await chat.reply(
                "You need at least one worker or soldier! Use: empire recruit"
              );
            }
            const now = Date.now();
            const lastTrain = userData.empire.lastTrain || 0;
            if (now - lastTrain < 24 * 60 * 60 * 1000) {
              const remaining = Math.ceil((24 * 60 * 60 * 1000 - (now - lastTrain)) / (60 * 60 * 1000));
              return await chat.reply(
                `Training is on cooldown. Try again in ${remaining} hour(s).`
              );
            }
            const soldiers = userData.empire.soldiers.map((soldier) => ({
              ...soldier,
              strength: soldier.strength + 2,
              agility: soldier.agility + 2,
              endurance: soldier.endurance + 2,
              level: soldier.level + 1,
            }));
            const workers = userData.empire.workers.map((worker) => ({
              ...worker,
              level: worker.level + 1,
            }));
            await hoshinoDB.set(event.senderID, {
              ...userData,
              empire: {
                ...userData.empire,
                soldiers,
                workers,
                lastTrain: now,
              },
            });
            const trained = [];
            if (soldiers.length > 0) trained.push(`${soldiers.length} soldier(s) (+2 strength, agility, endurance, +1 level)`);
            if (workers.length > 0) trained.push(`${workers.length} worker(s) (+1 level)`);
            await chat.reply(`Training complete! Improved: ${trained.join(", ")}.`);
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
            const { castle, workers, soldiers, earnings = 0, rebuildProgress = 0, lastRebuild = 0, recruitLimit = 5, upgradeCost = 100000000 } = userData.empire;
            const maxHealth = 100 + (castle.level - 1) * 20;
            const avgWorkerLevel = workers.length > 0 ? (workers.reduce((sum, w) => sum + w.level, 0) / workers.length).toFixed(1) : 1;
            const availableSlots = recruitLimit - (workers.length + soldiers.length);
            const soldierDetails = soldiers.length > 0
              ? soldiers.map(s => `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} (Level ${s.level}, Strength ${s.strength}, Agility ${s.agility}, Endurance ${s.endurance})`).join(", ")
              : "No soldiers recruited.";
            const statusInfo = [
              `Castle: Level ${castle.level}, Health ${castle.health}/${maxHealth}, Defense ${castle.defense}`,
              `Workers: ${workers.length} (Avg Level ${avgWorkerLevel})`,
              `Soldiers: ${soldiers.length} (${soldierDetails})`,
              `Recruit Limit: ${recruitLimit} (${availableSlots} slot(s) available)`,
              `Next Upgrade Cost: $${upgradeCost.toLocaleString("en-US")}`,
              `Pending Earnings: $${earnings.toLocaleString("en-US")}`,
              rebuildProgress > 0
                ? `Rebuild Progress: ${(rebuildProgress * 100).toFixed(1)}%`
                : castle.health < maxHealth
                ? "Castle damaged! Use 'empire rebuild' to repair."
                : "Castle at full health.",
            ].join("\n");
            await chat.reply(statusInfo);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["improve"],
          description: "Upgrade your castle to increase health, defense, and occupancy (cost doubles each time).",
          usage: "empire upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            const currentUpgradeCost = userData.empire.upgradeCost || 100000000;
            if ((userData.balance || 0) < currentUpgradeCost) {
              return await chat.reply(
                `You need $${currentUpgradeCost.toLocaleString("en-US")} to upgrade your castle!`
              );
            }
            const castle = userData.empire.castle;
            const newRecruitLimit = (userData.empire.recruitLimit || 5) + 1; 
            const newUpgradeCost = currentUpgradeCost * 2; 
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - currentUpgradeCost,
              empire: {
                ...userData.empire,
                castle: {
                  ...castle,
                  level: castle.level + 1,
                  health: castle.health + 20,
                  defense: castle.defense + 5,
                },
                recruitLimit: newRecruitLimit,
                upgradeCost: newUpgradeCost,
              },
            });
            await chat.reply(
              `Castle upgraded to level ${castle.level + 1}! +20 health, +5 defense, +1 recruit slot (now ${newRecruitLimit}). $${currentUpgradeCost.toLocaleString("en-US")} deducted. Next upgrade: $${newUpgradeCost.toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "conquer",
          aliases: ["raid"],
          description: "Send your entire army to conquer another player's castle (50% chance, 30-min cooldown, possible army losses).",
          usage: "empire conquer",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.empire || !userData.empire.hasLand) {
              return await chat.reply(
                "You need to buy land first! Use: empire buy"
              );
            }
            if (userData.empire.soldiers.length === 0) {
              return await chat.reply(
                "You need at least one soldier! Use: empire recruit"
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

            let survivingSoldiers = [...userData.empire.soldiers];
            let targetSurvivingSoldiers = [...targetData.empire.soldiers];
            let userLossMessage = "";
            let targetLossMessage = "";

            if (userData.empire.soldiers.length > 1) { 
              const lossType = Math.random() < 0.5 ? "half" : "twenty";
              const soldiersToLose = lossType === "half"
                ? Math.floor(userData.empire.soldiers.length / 2)
                : Math.floor(userData.empire.soldiers.length * 0.2);
              if (soldiersToLose > 0) {
                const lostSoldiers = [];
                const indices = [...Array(userData.empire.soldiers.length).keys()];
                for (let i = 0; i < soldiersToLose; i++) {
                  const randomIndex = Math.floor(Math.random() * indices.length);
                  const soldierIndex = indices.splice(randomIndex, 1)[0];
                  lostSoldiers.push(userData.empire.soldiers[soldierIndex]);
                }
                survivingSoldiers = userData.empire.soldiers.filter((_, i) => !lostSoldiers.includes(userData.empire.soldiers[i]));
                const lossCounts = lostSoldiers.reduce((acc, s) => {
                  acc[s.type] = (acc[s.type] || 0) + 1;
                  return acc;
                }, {});
                const lossDetails = Object.entries(lossCounts)
                  .map(([type, count]) => `${count} ${type.charAt(0).toUpperCase() + type.slice(1)}`)
                  .join(", ");
                userLossMessage = `Lost ${soldiersToLose} soldier(s): ${lossDetails}.`;
              }
            }

            if (targetData.empire.soldiers.length > 1) { 
              const lossType = Math.random() < 0.5 ? "half" : "twenty";
              const soldiersToLose = lossType === "half"
                ? Math.floor(targetData.empire.soldiers.length / 2)
                : Math.floor(targetData.empire.soldiers.length * 0.2);
              if (soldiersToLose > 0) {
                const lostSoldiers = [];
                const indices = [...Array(targetData.empire.soldiers.length).keys()];
                for (let i = 0; i < soldiersToLose; i++) {
                  const randomIndex = Math.floor(Math.random() * indices.length);
                  const soldierIndex = indices.splice(randomIndex, 1)[0];
                  lostSoldiers.push(targetData.empire.soldiers[soldierIndex]);
                }
                targetSurvivingSoldiers = targetData.empire.soldiers.filter((_, i) => !lostSoldiers.includes(targetData.empire.soldiers[i]));
                const lossCounts = lostSoldiers.reduce((acc, s) => {
                  acc[s.type] = (acc[s.type] || 0) + 1;
                  return acc;
                }, {});
                const lossDetails = Object.entries(lossCounts)
                  .map(([type, count]) => `${count} ${type.charAt(0).toUpperCase() + type.slice(1)}`)
                  .join(", ");
                targetLossMessage = `They lost ${soldiersToLose} soldier(s): ${lossDetails}.`;
              } else {
                targetLossMessage = "They lost no soldiers.";
              }
            } else {
              targetLossMessage = "They lost no soldiers.";
            }

            if (success) {
              const loot = Math.floor((targetData.balance || 0) * 0.5); 
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: (userData.balance || 0) + loot,
                diamonds: (userData.diamonds || 0) + randomDiamonds,
                empire: {
                  ...userData.empire,
                  soldiers: survivingSoldiers,
                  lastConquer: now,
                },
              });
              await hoshinoDB.set(targetUID, {
                ...targetData,
                empire: {
                  ...targetData.empire,
                  castle: {
                    ...targetData.empire.castle,
                    health: Math.max(0, targetData.empire.castle.health - 20),
                  },
                  soldiers: targetSurvivingSoldiers,
                },
                balance: Math.max(0, (targetData.balance || 0) - loot),
              });
              const message = [
                `You conquered ${targetData.username}'s castle!`,
                `Gained $${loot.toLocaleString("en-US")} and 💎${randomDiamonds}.`,
                `Their castle lost 20 health.`,
                targetLossMessage,
                userLossMessage || "Your army suffered no losses."
              ].filter(Boolean).join(" ");
              await chat.reply(message);
            } else {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                empire: {
                  ...userData.empire,
                  castle: {
                    ...userData.empire.castle,
                    health: Math.max(0, userData.empire.castle.health - 20),
                  },
                  soldiers: survivingSoldiers,
                  lastConquer: now,
                },
                balance: 0,
              });
              await hoshinoDB.set(targetUID, {
                ...targetData,
                balance: (targetData.balance || 0) + (userData.balance || 0),
                diamonds: (targetData.diamonds || 0) + randomDiamonds,
              });
              const message = [
                `You failed to conquer ${targetData.username}'s castle!`,
                `Your castle lost 20 health and all money.`,
                `They gained 💎${randomDiamonds}.`,
                targetLossMessage,
                userLossMessage || "Your army suffered no losses."
              ].filter(Boolean).join(" ");
              await chat.reply(message);
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
                "You need at least one worker to rebuild! Use: empire recruit"
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
