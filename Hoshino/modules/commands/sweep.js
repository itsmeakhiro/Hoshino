/**
 *  @type {HoshinoLia.Command} 
 */
const command = {
  manifest: {
    name: "sweep",
    aliases: ["clean", "broom"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Run a sweeping simulator to earn money by starting to sweep random trash, checking status, collecting earnings, and upgrading your broom.",
    category: "Economy",
    usage: "sweep start | sweep status | sweep collect | sweep upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🧹 〙 SWEEP",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const items = [
      { name: "Plastic Bottle", value: 10, weight: 30, emoji: "🍼" },
      { name: "Candy Wrapper", value: 5, weight: 25, emoji: "🍬" },
      { name: "Old Newspaper", value: 15, weight: 20, emoji: "📰" },
      { name: "Broken Toy", value: 50, weight: 15, emoji: "🧸" },
      { name: "Lost Coin", value: 100, weight: 8, emoji: "💰" },
      { name: "Shiny Trinket", value: 500, weight: 2, emoji: "✨" },
    ];

    const broom = {
      name: "Magic Broom",
      baseUpgradeCost: 50,
      baseEarningsMultiplier: 1.0,
      earningsIncreasePerLevel: 0.1,
      luckIncreasePerLevel: 0.02,
      emoji: "🧹",
    };

    const getRandomItem = (broomLevel) => {
      const luckFactor = 1 + broomLevel * broom.luckIncreasePerLevel;
      const adjustedWeights = items.map((item) => ({
        ...item,
        adjustedWeight: item.weight / Math.pow(luckFactor, items.indexOf(item)),
      }));
      const totalWeight = adjustedWeights.reduce((sum, item) => sum + item.adjustedWeight, 0);
      let random = Math.random() * totalWeight;
      for (const item of adjustedWeights) {
        random -= item.adjustedWeight;
        if (random <= 0) return { ...item, adjustedWeight: undefined };
      }
      return adjustedWeights[0];
    };

    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "start",
          aliases: ["begin", "sweep"],
          description: "Start sweeping to collect random trash over time.",
          usage: "sweep start",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.sweep) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                sweep: {
                  active: false,
                  startTime: 0,
                  lastCollectionTime: 0,
                  broomLevel: 1,
                },
              });
              return await chat.reply(
                `You received a ${broom.name} ${broom.emoji}! Use 'sweep start' to begin sweeping.`
              );
            }
            if (userData.sweep.active && userData.sweep.startTime) {
              const timeElapsed = (Date.now() - userData.sweep.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                await hoshinoDB.set(event.senderID, {
                  ...userData,
                  sweep: {
                    ...userData.sweep,
                    active: false,
                    startTime: 0,
                    lastCollectionTime: 0,
                  },
                });
                return await chat.reply(
                  "Sweeping session is invalid. Starting a new session."
                );
              }
              const broomLevel = userData.sweep.broomLevel || 1;
              const collectionEvents = Math.floor(timeElapsed / 5) || 1;
              let totalEarned = 0;
              const itemsFound = [];
              for (let i = 0; i < collectionEvents; i++) {
                const item = getRandomItem(broomLevel);
                totalEarned += item.value * (broom.baseEarningsMultiplier + (broomLevel - 1) * broom.earningsIncreasePerLevel);
                itemsFound.push(item);
              }
              const newBalance = (userData.balance || 0) + Math.floor(totalEarned);
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: newBalance,
                sweep: {
                  ...userData.sweep,
                  active: false,
                  startTime: 0,
                  lastCollectionTime: Date.now(),
                },
              });
              const timeDisplay =
                timeElapsed < 1
                  ? `${Math.floor(timeElapsed * 60)} seconds`
                  : `${Math.floor(timeElapsed)} minutes`;
              const uniqueItems = [...new Set(itemsFound.map((item) => item.name))];
              const message =
                `Previous sweeping session ran for ${timeDisplay}:\n` +
                `Items Found: ${uniqueItems.join(", ") || "None"}\n` +
                `Earnings: $${Math.floor(totalEarned).toLocaleString("en-US")}\n` +
                `New Balance: $${newBalance.toLocaleString("en-US")}\n\n`;
              const startTime = Date.now();
              await hoshinoDB.set(event.senderID, {
                ...userData,
                sweep: {
                  ...userData.sweep,
                  active: true,
                  startTime,
                  lastCollectionTime: startTime,
                },
              });
              await chat.reply(
                message +
                  `New sweeping session started with your ${broom.name} ${
                    broom.emoji
                  }! Use 'sweep collect' to collect earnings.`
              );
            } else {
              const startTime = Date.now();
              await hoshinoDB.set(event.senderID, {
                ...userData,
                sweep: {
                  ...userData.sweep,
                  active: true,
                  startTime,
                  lastCollectionTime: startTime,
                },
              });
              await chat.reply(
                `Sweeping started with your ${broom.name} ${
                  broom.emoji
                }! Use 'sweep collect' to collect earnings.`
              );
            }
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check your sweeping progress, broom level, and estimated earnings.",
          usage: "sweep status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.sweep) {
              return await chat.reply(
                `You don't have a ${broom.name}! Use 'sweep start' to receive one.`
              );
            }
            const broomLevel = userData.sweep.broomLevel || 1;
            let message = `Broom: ${broom.name} ${broom.emoji} (Level ${broomLevel})\n` +
                          `Earnings Multiplier: ${(broom.baseEarningsMultiplier + (broomLevel - 1) * broom.earningsIncreasePerLevel).toFixed(2)}x\n` +
                          `Luck Factor: ${(1 + broomLevel * broom.luckIncreasePerLevel).toFixed(2)}x (increases rare item chance)\n`;
            if (!userData.sweep.active || !userData.sweep.startTime) {
              message += "Status: Not currently sweeping. Use 'sweep start' to begin.";
              return await chat.reply(message);
            }
            const timeElapsed = (Date.now() - userData.sweep.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                sweep: {
                  ...userData.sweep,
                  active: false,
                  startTime: 0,
                  lastCollectionTime: 0,
                },
              });
              return await chat.reply(
                "Sweeping session is invalid. Please start a new session with 'sweep start'."
              );
            }
            const collectionEvents = Math.floor(timeElapsed / 5) || 1;
            let totalEarned = 0;
            const itemsFound = [];
            for (let i = 0; i < collectionEvents; i++) {
              const item = getRandomItem(broomLevel);
              totalEarned += item.value * (broom.baseEarningsMultiplier + (broomLevel - 1) * broom.earningsIncreasePerLevel);
              itemsFound.push(item);
            }
            const timeDisplay =
              timeElapsed < 1
                ? `${Math.floor(timeElapsed * 60)} seconds`
                : `${Math.floor(timeElapsed)} minutes`;
            const uniqueItems = [...new Set(itemsFound.map((item) => item.name))];
            message += `Status: Sweeping for ${timeDisplay}\n` +
                      `Estimated Items: ${uniqueItems.join(", ") || "None"}\n` +
                      `Estimated Earnings: $${Math.floor(totalEarned).toLocaleString("en-US")}\n` +
                      `Use 'sweep collect' to claim these earnings.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "earnings"],
          description: "Collect earnings from your sweeping session.",
          usage: "sweep collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.sweep) {
              return await chat.reply(
                `You don't have a ${broom.name}! Use 'sweep start' to receive one.`
              );
            }
            if (!userData.sweep.active || !userData.sweep.startTime) {
              return await chat.reply(
                "You haven't started sweeping! Use 'sweep start' to begin."
              );
            }
            const timeElapsed = (Date.now() - userData.sweep.startTime) / 1000 / 60;
            if (Date.now() - userData.sweep.lastCollectionTime < 60000) {
              return await chat.reply(
                "No earnings yet. Come back after a minute or more to collect."
              );
            }
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                sweep: {
                  ...userData.sweep,
                  active: false,
                  startTime: 0,
                  lastCollectionTime: 0,
                },
              });
              return await chat.reply(
                "Sweeping session is invalid. Please restart with 'sweep start'."
              );
            }
            const broomLevel = userData.sweep.broomLevel || 1;
            const collectionEvents = Math.floor(timeElapsed / 5) || 1;
            let totalEarned = 0;
            const itemsFound = [];
            for (let i = 0; i < collectionEvents; i++) {
              const item = getRandomItem(broomLevel);
              totalEarned += item.value * (broom.baseEarningsMultiplier + (broomLevel - 1) * broom.earningsIncreasePerLevel);
              itemsFound.push(item);
            }
            const newBalance = (userData.balance || 0) + Math.floor(totalEarned);
            const newStartTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              sweep: {
                ...userData.sweep,
                active: true,
                startTime: newStartTime,
                lastCollectionTime: newStartTime,
              },
            });
            const timeDisplay =
              timeElapsed < 1
                ? `${Math.floor(timeElapsed * 60)} seconds`
                : `${Math.floor(timeElapsed)} minutes`;
            const uniqueItems = [...new Set(itemsFound.map((item) => item.name))];
            const replyMessage =
              `Collected earnings from sweeping for ${timeDisplay}:\n` +
              `Items Found: ${uniqueItems.join(", ") || "None"}\n` +
              `Earnings: $${Math.floor(totalEarned).toLocaleString("en-US")}\n` +
              `New Balance: $${newBalance.toLocaleString("en-US")}`;
            await chat.reply(replyMessage);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["enhance", "improve"],
          description: "Upgrade your broom to increase earnings and luck.",
          usage: "sweep upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.sweep) {
              return await chat.reply(
                `You don't have a ${broom.name}! Use 'sweep start' to receive one.`
              );
            }
            const broomLevel = userData.sweep.broomLevel || 1;
            const upgradeCost = broom.baseUpgradeCost * Math.pow(2, broomLevel - 1);
            const currentBalance = userData.balance || 0;
            if (currentBalance < upgradeCost) {
              return await chat.reply(
                `You need $${upgradeCost.toLocaleString(
                  "en-US"
                )} to upgrade your ${broom.name}, but you only have $${currentBalance.toLocaleString(
                  "en-US"
                )}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - upgradeCost,
              sweep: {
                ...userData.sweep,
                broomLevel: broomLevel + 1,
              },
            });
            const newLevel = broomLevel + 1;
            await chat.reply(
              `Successfully upgraded your ${broom.name} to Level ${newLevel} for $${upgradeCost.toLocaleString(
                "en-US"
              )}! Earnings multiplier increased to ${(broom.baseEarningsMultiplier + (newLevel - 1) * broom.earningsIncreasePerLevel).toFixed(
                2
              )}x, luck factor increased to ${(1 + newLevel * broom.luckIncreasePerLevel).toFixed(2)}x.`
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
