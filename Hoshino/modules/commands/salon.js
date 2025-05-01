/**
 * @type {HoshinoLia.Command} 
 */

const command = {
  manifest: {
    name: "salon",
    aliases: ["shop", "beauty"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage a beauty salon to earn money by offering services, upgrading your shop, and recruiting stylists.",
    category: "Simulation",
    usage: "salon start | salon buy | salon recruit | salon status | salon collect | salon upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💇‍♀️ 〙 BEAUTY SALON",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const services = {
      basic: { name: "Basic Service", value: 10, emoji: "💇‍♀️", minLevel: 1 },
      premium: { name: "Premium Service", value: 100, emoji: "💅", minLevel: 3 },
      luxury: { name: "Luxury Service", value: 500, emoji: "✨", minLevel: 5 },
    };
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "start",
          aliases: ["begin", "open"],
          description: "Start your salon to begin earning money.",
          usage: "salon start",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || userData.salon.shopLevel === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            let message = "";
            let shopLevel = userData.salon.shopLevel || 1;
            let recruits = userData.salon.recruits || 0;
            let recruitLevel = userData.salon.recruitLevel || 0;
            let totalEarnings = userData.salon.totalEarnings || 0;
            if (userData.salon.active && userData.salon.startTime) {
              const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                message = "Salon session is invalid. Starting a new session.\n";
              } else if (timeElapsed > 0) {
                const availableServices = Object.entries(services)
                  .filter(([_, service]) => shopLevel >= service.minLevel)
                  .map(([key]) => key);
                const collectedServices = { basic: 0, premium: 0, luxury: 0 };
                let totalEarned = 0;
                let serviceEvents = Math.floor(timeElapsed / 5) || 1;
                let minYield = 50 * shopLevel;
                let maxYield = 100 * shopLevel;
                let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
                let taxMultiplier = Math.max(0.1, (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits));
                for (let i = 0; i < serviceEvents; i++) {
                  const numServices = Math.floor(Math.random() * availableServices.length) + 1;
                  const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
                  for (const service of selectedServices) {
                    const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                    collectedServices[service] = (collectedServices[service] || 0) + quantity;
                    totalEarned += quantity * services[service].value;
                  }
                }
                totalEarned *= earningsMultiplier * taxMultiplier;
                const currentBalance = userData.balance || 0;
                totalEarned = Math.min(totalEarned, currentBalance + totalEarned >= 0 ? totalEarned : currentBalance);
                const newBalance = currentBalance + totalEarned;
                totalEarnings += totalEarned;
                await hoshinoDB.set(event.senderID, {
                  ...userData,
                  balance: newBalance,
                  salon: {
                    active: false,
                    startTime: 0,
                    shopLevel,
                    recruits,
                    recruitLevel,
                    collectedServices: { basic: 0, premium: 0, luxury: 0 },
                    lastCollectionTime: Date.now(),
                    totalEarnings,
                  },
                });
                const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
                message += `Operated for ${timeDisplay}:\n` +
                  Object.entries(collectedServices)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                    .join("\n") +
                  `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
                  `\nTotal: $${totalEarned.toLocaleString("en-US")}\n`;
              }
            }
            const startTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              salon: {
                active: true,
                startTime,
                shopLevel,
                recruits,
                recruitLevel,
                collectedServices: { basic: 0, premium: 0, luxury: 0 },
                lastCollectionTime: userData.salon?.lastCollectionTime || 0,
                totalEarnings,
              },
            });
            message += `Salon opened at Level ${shopLevel} 🏬${recruits ? ` with ${recruits} Level ${recruitLevel} stylist(s) 👩‍💼` : ""}! Use 'salon collect' to gather earnings.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "property"],
          description: "Buy a Starter Salon to start your business.",
          usage: "salon buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.salon?.shopLevel > 0) {
              return await chat.reply(
                `You already own a Level ${userData.salon.shopLevel} Salon! Use 'salon upgrade' to improve it.`
              );
            }
            const cost = 2000;
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to buy a Starter Salon, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                active: false,
                startTime: 0,
                shopLevel: 1,
                recruits: 0,
                recruitLevel: 0,
                collectedServices: { basic: 0, premium: 0, luxury: 0 },
                lastCollectionTime: 0,
                totalEarnings: 0,
              },
            });
            await chat.reply(
              `Successfully purchased a Starter Salon 🏬 for $${cost.toLocaleString("en-US")}! You'll pay a 5% property tax per shop level (capped at 90% total tax). Use 'salon start' to begin. Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "stylist"],
          description: "Recruit a stylist to boost earnings (with a salary tax).",
          usage: "salon recruit",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || userData.salon.shopLevel === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const currentRecruits = userData.salon.recruits || 0;
            if (currentRecruits >= 10) {
              return await chat.reply(
                "You have reached the maximum of 10 stylists!"
              );
            }
            const cost = 1000 * (currentRecruits + 1);
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to recruit a stylist, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                ...userData.salon,
                recruits: currentRecruits + 1,
              },
            });
            const newMultiplier = 2 + 0.5 * (currentRecruits + 1);
            await chat.reply(
              `Successfully recruited a stylist 👩‍💼 for $${cost.toLocaleString("en-US")}! You now have ${currentRecruits + 1} stylist(s), boosting earnings to ${newMultiplier}x but adding a 10% salary tax per stylist (capped at 90% total tax). Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check your salon’s progress and estimated earnings.",
          usage: "salon status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || userData.salon.shopLevel === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const shopLevel = userData.salon.shopLevel || 1;
            const recruits = userData.salon.recruits || 0;
            const recruitLevel = userData.salon.recruitLevel || 0;
            let message = `Current Salon: Level ${shopLevel} 🏬${recruits ? ` with ${recruits} Level ${recruitLevel} stylist(s) 👩‍💼` : ""}\n`;
            if (!userData.salon.active || !userData.salon.startTime) {
              message += "Status: Not currently operating. Use 'salon start' to begin.\n";
              return await chat.reply(message);
            }
            const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                salon: {
                  active: false,
                  startTime: 0,
                  shopLevel,
                  recruits,
                  recruitLevel,
                  collectedServices: { basic: 0, premium: 0, luxury: 0 },
                  lastCollectionTime: userData.salon?.lastCollectionTime || 0,
                  totalEarnings: userData.salon?.totalEarnings || 0,
                },
              });
              return await chat.reply(
                "Salon session is invalid. Please start a new session with 'salon start'."
              );
            }
            const availableServices = Object.entries(services)
              .filter(([_, service]) => shopLevel >= service.minLevel)
              .map(([key]) => key);
            const collectedServices = { basic: 0, premium: 0, luxury: 0 };
            let totalEarned = 0;
            let serviceEvents = Math.floor(timeElapsed / 5) || 1;
            let minYield = 50 * shopLevel;
            let maxYield = 100 * shopLevel;
            let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
            let taxMultiplier = Math.max(0.1, (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits));
            for (let i = 0; i < serviceEvents; i++) {
              const numServices = Math.floor(Math.random() * availableServices.length) + 1;
              const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
              for (const service of selectedServices) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedServices[service] = (collectedServices[service] || 0) + quantity;
                totalEarned += quantity * services[service].value;
              }
            }
            totalEarned *= earningsMultiplier * taxMultiplier;
            message += `Status: Operating for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}\n` +
                      `Estimated Services:\n` +
                      (Object.keys(collectedServices).some(s => collectedServices[s] > 0)
                        ? Object.entries(collectedServices)
                            .filter(([_, quantity]) => quantity > 0)
                            .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                            .join("\n")
                        : "No services performed yet.") +
                      `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax (capped at 90% total)` +
                      `\nTotal Earnings: $${totalEarned.toLocaleString("en-US")}`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "earn"],
          description: "Collect earnings from your salon services.",
          usage: "salon collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.active || !userData.salon.startTime) {
              return await chat.reply(
                "You haven't started your salon! Use 'salon start' to begin."
              );
            }
            if (userData.salon.shopLevel === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                salon: {
                  active: false,
                  startTime: 0,
                  shopLevel: userData.salon.shopLevel,
                  recruits: userData.salon.recruits || 0,
                  recruitLevel: userData.salon.recruitLevel || 0,
                  collectedServices: { basic: 0, premium: 0, luxury: 0 },
                  lastCollectionTime: userData.salon.lastCollectionTime || 0,
                  totalEarnings: userData.salon.totalEarnings || 0,
                },
              });
              return await chat.reply(
                "Salon session is invalid. Please start a new session with 'salon start'."
              );
            }
            const lastCollectionTime = userData.salon.lastCollectionTime || 0;
            if (Date.now() - lastCollectionTime < 60000) {
              return await chat.reply(
                "No services performed yet. Come back after a minute or an hour for the collection."
              );
            }
            if (timeElapsed <= 0) {
              return await chat.reply(
                "No services performed yet. Come back after a minute or an hour for the collection."
              );
            }
            const shopLevel = userData.salon.shopLevel;
            const recruits = userData.salon.recruits || 0;
            const recruitLevel = userData.salon.recruitLevel || 0;
            const availableServices = Object.entries(services)
              .filter(([_, service]) => shopLevel >= service.minLevel)
              .map(([key]) => key);
            const collectedServices = { basic: 0, premium: 0, luxury: 0 };
            let totalEarned = 0;
            let serviceEvents = Math.floor(timeElapsed / 5) || 1;
            let minYield = 50 * shopLevel;
            let maxYield = 100 * shopLevel;
            let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
            let taxMultiplier = Math.max(0.1, (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits));
            for (let i = 0; i < serviceEvents; i++) {
              const numServices = Math.floor(Math.random() * availableServices.length) + 1;
              const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
              for (const service of selectedServices) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedServices[service] = (collectedServices[service] || 0) + quantity;
                totalEarned += quantity * services[service].value;
              }
            }
            totalEarned *= earningsMultiplier * taxMultiplier;
            const currentBalance = userData.balance || 0;
            totalEarned = Math.min(totalEarned, currentBalance + totalEarned >= 0 ? totalEarned : currentBalance);
            const newBalance = currentBalance + totalEarned;
            const newStartTime = Date.now();
            const totalEarnings = (userData.salon.totalEarnings || 0) + totalEarned;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              salon: {
                active: true,
                startTime: newStartTime,
                shopLevel,
                recruits,
                recruitLevel,
                collectedServices: { basic: 0, premium: 0, luxury: 0 },
                lastCollectionTime: newStartTime,
                totalEarnings,
              },
            });
            const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
            const replyMessage = `Operated for ${timeDisplay}:\n` +
              Object.entries(collectedServices)
                .filter(([_, quantity]) => quantity > 0)
                .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                .join("\n") +
              `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax (capped at 90% total)` +
              `\nTotal: $${totalEarned.toLocaleString("en-US")}\nYour new balance is $${newBalance.toLocaleString("en-US")}.`;
            await chat.reply(replyMessage);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["expand", "improve"],
          description: "Upgrade your salon and stylists for higher earnings.",
          usage: "salon upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || userData.salon.shopLevel === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const shopLevel = userData.salon.shopLevel;
            const recruits = userData.salon.recruits || 0;
            const recruitLevel = userData.salon.recruitLevel || 0;
            const shopUpgradeCost = 5000 * shopLevel * (recruits + 1);
            const recruitUpgradeCost = recruits > 0 ? 2000 * recruitLevel * recruits : 0;
            const totalCost = shopUpgradeCost + recruitUpgradeCost;
            const currentBalance = userData.balance || 0;
            if (currentBalance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString("en-US")} to upgrade your salon${recruits > 0 ? " and stylists" : ""}, but you only have $${currentBalance.toLocaleString("en-US")}! (Shop: $${shopUpgradeCost.toLocaleString("en-US")}${recruits > 0 ? `, Stylists: $${recruitUpgradeCost.toLocaleString("en-US")}` : ""})`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - totalCost,
              salon: {
                ...userData.salon,
                shopLevel: shopLevel + 1,
                recruitLevel: recruits > 0 ? recruitLevel + 1 : recruitLevel,
              },
            });
            let message = `Successfully upgraded your salon to Level ${shopLevel + 1} 🏬 for $${shopUpgradeCost.toLocaleString("en-US")}!`;
            if (recruits > 0) {
              message += ` Your ${recruits} stylist(s) upgraded to Level ${recruitLevel + 1} 👩‍💼 for $${recruitUpgradeCost.toLocaleString("en-US")}.`;
            }
            message += ` Your new balance is $${(currentBalance - totalCost).toLocaleString("en-US")}.`;
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