/** @type {HoshinoLia.Command} */
const command = {
  manifest: {
    name: "salon",
    aliases: ["shop", "beauty"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage a beauty salon to earn money by offering services, upgrading your shop, and recruiting stylists. Pay taxes or risk automatic closure!",
    category: "Economy",
    usage: "salon start | salon buy | salon recruit | salon status | salon collect | salon upgrade | salon paytax",
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
    const bankruptcyThreshold = (shopLevel) => 10000 * shopLevel;
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
              if (userData.salon?.taxDebt > 0) {
                return await chat.reply(
                  `Your salon was closed due to $${userData.salon.taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your previous salon (Level ${userData.salon.bankruptState?.shopLevel || 0}) or 'salon buy' to start over.`
                );
              }
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            let message = "";
            let shopLevel = userData.salon.shopLevel || 1;
            let recruits = userData.salon.recruits || 0;
            let recruitLevel = userData.salon.recruitLevel || 0;
            let totalEarnings = userData.salon.totalEarnings || 0;
            let taxDebt = userData.salon.taxDebt || 0; // Changed to let
            let bankruptState = userData.salon.bankruptState || null;
            if (userData.salon.active && userData.salon.startTime) {
              const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                message = "Salon session is invalid. Starting a new session.\n";
              } else if (timeElapsed > 0) {
                const availableServices = Object.entries(services)
                  .filter(([_, service]) => shopLevel >= service.minLevel)
                  .map(([key]) => key);
                const collectedServices = { basic: 0, premium: 0, luxury: 0 };
                let baseEarnings = 0;
                let serviceEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
                let minYield = 50 * shopLevel;
                let maxYield = 100 * shopLevel;
                let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
                let taxRate = 1 - (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits);
                for (let i = 0; i < serviceEvents; i++) {
                  const numServices = Math.floor(Math.random() * availableServices.length) + 1;
                  const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
                  for (const service of selectedServices) {
                    const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                    collectedServices[service] = (collectedServices[service] || 0) + quantity;
                    baseEarnings += quantity * services[service].value;
                  }
                }
                let totalEarned = baseEarnings * earningsMultiplier;
                let taxesOwed = baseEarnings * taxRate;
                if (totalEarned < taxesOwed) {
                  taxDebt += taxesOwed - totalEarned;
                  totalEarned = 0;
                } else {
                  totalEarned -= taxesOwed;
                }
                const newBalance = (userData.balance || 0) + totalEarned;
                totalEarnings += totalEarned;
                const isBankrupt = taxDebt > bankruptcyThreshold(shopLevel);
                if (isBankrupt) {
                  await hoshinoDB.set(event.senderID, {
                    ...userData,
                    balance: newBalance,
                    salon: {
                      active: false,
                      startTime: 0,
                      shopLevel: 0,
                      recruits: 0,
                      recruitLevel: 0,
                      collectedServices: { basic: 0, premium: 0, luxury: 0 },
                      lastCollectionTime: 0,
                      totalEarnings: 0,
                      taxDebt,
                      bankruptState: { shopLevel, recruits, recruitLevel, totalEarnings },
                    },
                  });
                  message += `Operated for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}:\n` +
                    Object.entries(collectedServices)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                      .join("\n") +
                    `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
                    `\nTotal: $${totalEarned.toLocaleString("en-US")}` +
                    (taxDebt > 0 ? `\nUnpaid Tax Debt: $${taxDebt.toLocaleString("en-US")}` : "") +
                    `\nYour salon has been closed due to $${taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your Level ${shopLevel} salon or 'salon buy' to start over.\n`;
                  await chat.reply(message);
                  return;
                }
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
                    taxDebt,
                    bankruptState,
                  },
                });
                message += `Operated for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}:\n` +
                  Object.entries(collectedServices)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                    .join("\n") +
                  `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
                  `\nTotal: $${totalEarned.toLocaleString("en-US")}` +
                  (taxDebt > 0 ? `\nUnpaid Tax Debt: $${taxDebt.toLocaleString("en-US")}` : "") +
                  `\n`;
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
                taxDebt,
                bankruptState,
              },
            });
            message += `Salon opened at Level ${shopLevel} 🏬${recruits ? ` with ${recruits} Level ${recruitLevel} stylist(s) 👩‍💼` : ""}${taxDebt > 0 ? ` (Tax Debt: $${taxDebt.toLocaleString("en-US")})` : ""}! Use 'salon collect' to gather earnings.`;
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
              balance: previousBalance - cost,
              salon: {
                active: false,
                startTime: 0,
                shopLevel: 1,
                recruits: 0,
                recruitLevel: 0,
                collectedServices: { basic: 0, premium: 0, luxury: 0 },
                lastCollectionTime: 0,
                totalEarnings: 0,
                taxDebt: userData.salon?.taxDebt || 0,
                bankruptState: null,
              },
            });
            await chat.reply(
              `Successfully purchased a Starter Salon 🏬 for $${cost.toLocaleString("en-US")}! You'll pay a 5% property tax per shop level and 10% salary tax per stylist. Use 'salon start' to begin. Your new balance is $${(previousBalance - cost).toLocaleString("en-US")}.`
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
              if (userData.salon?.taxDebt > 0) {
                return await chat.reply(
                  `Your salon was closed due to $${userData.salon.taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your previous salon (Level ${userData.salon.bankruptState?.shopLevel || 0}) or 'salon buy' to start over.`
                );
              }
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
              balance: previousBalance - cost,
              salon: {
                ...userData.salon,
                recruits: currentRecruits + 1,
              },
            });
            const newMultiplier = 2 + 0.5 * (currentRecruits + 1);
            await chat.reply(
              `Successfully recruited a stylist 👩‍💼 for $${cost.toLocaleString("en-US")}! You now have ${currentRecruits + 1} stylist(s), boosting earnings to ${newMultiplier}x but adding a 10% salary tax per stylist. Your new balance is $${(previousBalance - cost).toLocaleString("en-US")}.`
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
              if (userData.salon?.taxDebt > 0) {
                return await chat.reply(
                  `Your salon was closed due to $${userData.salon.taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your previous salon (Level ${userData.salon.bankruptState?.shopLevel || 0}) or 'salon buy' to start over.`
                );
              }
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const shopLevel = userData.salon.shopLevel || 1;
            const recruits = userData.salon.recruits || 0;
            const recruitLevel = userData.salon.recruitLevel || 0;
            const taxDebt = userData.salon.taxDebt || 0;
            let message = `Current Salon: Level ${shopLevel} 🏬${recruits ? ` with ${recruits} Level ${recruitLevel} stylist(s) 👩‍💼` : ""}${taxDebt > 0 ? ` (Tax Debt: $${taxDebt.toLocaleString("en-US")})` : ""}\n`;
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
                  taxDebt,
                  bankruptState: userData.salon?.bankruptState || null,
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
            let baseEarnings = 0;
            let serviceEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = 50 * shopLevel;
            let maxYield = 100 * shopLevel;
            let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
            let taxRate = 1 - (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits);
            for (let i = 0; i < serviceEvents; i++) {
              const numServices = Math.floor(Math.random() * availableServices.length) + 1;
              const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
              for (const service of selectedServices) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedServices[service] = (collectedServices[service] || 0) + quantity;
                baseEarnings += quantity * services[service].value;
              }
            }
            let totalEarned = baseEarnings * earningsMultiplier;
            let taxesOwed = baseEarnings * taxRate;
            if (totalEarned < taxesOwed) {
              taxDebt += taxesOwed - totalEarned;
              totalEarned = 0;
            } else {
              totalEarned -= taxesOwed;
            }
            message += `Status: Operating for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}\n` +
                      `Estimated Services:\n` +
                      (Object.keys(collectedServices).some(s => collectedServices[s] > 0)
                        ? Object.entries(collectedServices)
                            .filter(([_, quantity]) => quantity > 0)
                            .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                            .join("\n")
                        : "No services performed yet.") +
                      `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
                      `\nTotal Earnings: $${totalEarned.toLocaleString("en-US")}` +
                      (taxDebt > 0 ? `\nUnpaid Tax Debt: $${taxDebt.toLocaleString("en-US")}` : "");
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
              if (userData.salon?.taxDebt > 0) {
                return await chat.reply(
                  `Your salon was closed due to $${userData.salon.taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your previous salon (Level ${userData.salon.bankruptState?.shopLevel || 0}) or 'salon buy' to start over.`
                );
              }
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
                  taxDebt: userData.salon.taxDebt || 0,
                  bankruptState: userData.salon.bankruptState || null,
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
            let taxDebt = userData.salon.taxDebt || 0; // Changed to let
            let totalEarnings = userData.salon.totalEarnings || 0;
            let bankruptState = userData.salon.bankruptState || null;
            const availableServices = Object.entries(services)
              .filter(([_, service]) => shopLevel >= service.minLevel)
              .map(([key]) => key);
            const collectedServices = { basic: 0, premium: 0, luxury: 0 };
            let baseEarnings = 0;
            let serviceEvents = Math.floor(timeElapsed / (Math.random() * 29 + 1)) || 1;
            let minYield = 50 * shopLevel;
            let maxYield = 100 * shopLevel;
            let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
            let taxRate = 1 - (1 - 0.05 * shopLevel) * (1 - 0.1 * recruits);
            for (let i = 0; i < serviceEvents; i++) {
              const numServices = Math.floor(Math.random() * availableServices.length) + 1;
              const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
              for (const service of selectedServices) {
                const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
                collectedServices[service] = (collectedServices[service] || 0) + quantity;
                baseEarnings += quantity * services[service].value;
              }
            }
            let totalEarned = baseEarnings * earningsMultiplier;
            let taxesOwed = baseEarnings * taxRate;
            if (totalEarned < taxesOwed) {
              taxDebt += taxesOwed - totalEarned;
              totalEarned = 0;
            } else {
              totalEarned -= taxesOwed;
            }
            const newBalance = (userData.balance || 0) + totalEarned;
            totalEarnings += totalEarned;
            const isBankrupt = taxDebt > bankruptcyThreshold(shopLevel);
            const newStartTime = Date.now();
            if (isBankrupt) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: newBalance,
                salon: {
                  active: false,
                  startTime: 0,
                  shopLevel: 0,
                  recruits: 0,
                  recruitLevel: 0,
                  collectedServices: { basic: 0, premium: 0, luxury: 0 },
                  lastCollectionTime: 0,
                  totalEarnings: 0,
                  taxDebt,
                  bankruptState: { shopLevel, recruits, recruitLevel, totalEarnings },
                },
              });
              const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
              const replyMessage = `Operated for ${timeDisplay}:\n` +
                Object.entries(collectedServices)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                  .join("\n") +
                `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
                `\nTotal: $${totalEarned.toLocaleString("en-US")}` +
                (taxDebt > 0 ? `\nUnpaid Tax Debt: $${taxDebt.toLocaleString("en-US")}` : "") +
                `\nYour salon has been closed due to $${taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your Level ${shopLevel} salon or 'salon buy' to start over.`;
              await chat.reply(replyMessage);
              return;
            }
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
                taxDebt,
                bankruptState,
              },
            });
            const timeDisplay = timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`;
            const replyMessage = `Operated for ${timeDisplay}:\n` +
              Object.entries(collectedServices)
                .filter(([_, quantity]) => quantity > 0)
                .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                .join("\n") +
              `\nTaxes: ${Math.round((1 - (1 - 0.05 * shopLevel)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * recruits)) * 100)}% salary tax` +
              `\nTotal: $${totalEarned.toLocaleString("en-US")}` +
              (taxDebt > 0 ? `\nUnpaid Tax Debt: $${taxDebt.toLocaleString("en-US")}` : "") +
              `\nYour new balance is $${newBalance.toLocaleString("en-US")}.`;
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
              if (userData.salon?.taxDebt > 0) {
                return await chat.reply(
                  `Your salon was closed due to $${userData.salon.taxDebt.toLocaleString("en-US")} in unpaid taxes! Use 'salon paytax' to restore your previous salon (Level ${userData.salon.bankruptState?.shopLevel || 0}) or 'salon buy' to start over.`
                );
              }
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
              balance: previousBalance - totalCost,
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
            message += ` Your new balance is $${(previousBalance - totalCost).toLocaleString("en-US")}.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "paytax",
          aliases: ["pay", "settle"],
          description: "Pay off your salon's tax debt to restore or avoid closure.",
          usage: "salon paytax <amount>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const taxDebt = userData.salon.taxDebt || 0;
            if (taxDebt <= 0) {
              return await chat.reply(
                "You have no tax debt to pay!"
              );
            }
            const amount = parseInt(args[0]) || taxDebt;
            if (isNaN(amount) || amount <= 0) {
              return await chat.reply(
                "Please specify a valid amount to pay, e.g., 'salon paytax 500'."
              );
            }
            const payment = Math.min(amount, taxDebt);
            const currentBalance = userData.balance || 0;
            if (currentBalance < payment) {
              return await chat.reply(
                `You need $${payment.toLocaleString("en-US")} to pay that amount, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            const newTaxDebt = taxDebt - payment;
            const newBalance = previousBalance - payment;
            let newSalonState = { ...userData.salon, taxDebt: newTaxDebt };
            if (newTaxDebt === 0 && userData.salon.bankruptState) {
              newSalonState = {
                active: false,
                startTime: 0,
                shopLevel: userData.salon.bankruptState.shopLevel,
                recruits: userData.salon.bankruptState.recruits,
                recruitLevel: userData.salon.bankruptState.recruitLevel,
                collectedServices: { basic: 0, premium: 0, luxury: 0 },
                lastCollectionTime: 0,
                totalEarnings: userData.salon.bankruptState.totalEarnings,
                taxDebt: 0,
                bankruptState: null,
              };
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              salon: newSalonState,
            });
            let message = `Successfully paid $${payment.toLocaleString("en-US")} towards your tax debt! `;
            if (newTaxDebt > 0) {
              message += `Remaining debt: $${newTaxDebt.toLocaleString("en-US")}. `;
              if (userData.salon.bankruptState) {
                message += `Your salon remains closed. Pay the remaining debt to restore your Level ${userData.salon.bankruptState.shopLevel} salon.`;
              }
            } else {
              message += `All tax debt cleared! `;
              if (userData.salon.bankruptState) {
                message += `Your Level ${userData.salon.bankruptState.shopLevel} salon has been restored! Use 'salon start' to resume operations. `;
              } else {
                message += `Your salon is now debt-free. `;
              }
            }
            message += `Your new balance is $${newBalance.toLocaleString("en-US")}.`;
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