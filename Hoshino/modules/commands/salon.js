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
      "Manage beauty salons to earn money by offering services, upgrading shops, recruiting stylists, and opening branches.",
    category: "Economy",
    usage: "salon start [branchId] | salon buy | salon branch | salon recruit <branchId> | salon status [branchId] | salon collect [branchId] | salon upgrade <branchId>",
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
    const calculateEarnings = (branch, timeElapsed) => {
      const shopLevel = branch.shopLevel;
      const recruits = branch.recruits || 0;
      const recruitLevel = branch.recruitLevel || 0;
      const availableServices = Object.entries(services)
        .filter(([_, service]) => shopLevel >= service.minLevel)
        .map(([key]) => key);
      const collectedServices = { basic: 0, premium: 0, luxury: 0 };
      let totalEarned = 0;
      let serviceEvents = Math.floor(timeElapsed / 5) || 1;
      let minYield = 50 * shopLevel;
      let maxYield = 100 * shopLevel;
      let earningsMultiplier = shopLevel * (2 + 0.5 * recruits) * (1 + 0.2 * recruitLevel);
      for (let i = 0; i < serviceEvents; i++) {
        const numServices = Math.floor(Math.random() * availableServices.length) + 1;
        const selectedServices = availableServices.sort(() => Math.random() - 0.5).slice(0, numServices);
        for (const service of selectedServices) {
          const quantity = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
          collectedServices[service] = (collectedServices[service] || 0) + quantity;
          totalEarned += quantity * services[service].value;
        }
      }
      totalEarned *= earningsMultiplier;
      return { totalEarned, collectedServices };
    };
    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "start",
          aliases: ["begin", "open"],
          description: "Start one or all salon branches to begin earning money.",
          usage: "salon start [branchId]",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const branchId = parseInt(args[0]) || 0;
            const branches = userData.salon.branches;
            if (branchId && !branches.find(b => b.branchId === branchId)) {
              return await chat.reply(
                `Invalid branch ID. Please use a number between 1 and ${branches.length}. Available branches: ${branches.map(b => b.branchId).join(", ")}.`
              );
            }
            let message = "";
            let totalEarned = 0;
            let totalEarnings = userData.salon.totalEarnings || 0;
            let totalCollectedServices = { basic: 0, premium: 0, luxury: 0 };
            const targetBranches = branchId ? branches.filter(b => b.branchId === branchId) : branches;
            for (const branch of targetBranches) {
              if (branch.active && branch.startTime) {
                const timeElapsed = (Date.now() - branch.startTime) / 1000 / 60;
                if (!isNaN(timeElapsed) && timeElapsed > 0) {
                  const { totalEarned: branchEarned, collectedServices } = calculateEarnings(branch, timeElapsed);
                  totalEarned += branchEarned;
                  for (const [service, quantity] of Object.entries(collectedServices)) {
                    totalCollectedServices[service] = (totalCollectedServices[service] || 0) + quantity;
                  }
                  branch.active = false;
                  branch.startTime = 0;
                  branch.collectedServices = { basic: 0, premium: 0, luxury: 0 };
                }
              }
            }
            const totalShopLevels = branches.reduce((sum, b) => sum + b.shopLevel, 0);
            const totalRecruits = branches.reduce((sum, b) => sum + (b.recruits || 0), 0);
            const taxMultiplier = Math.max(0.1, (1 - 0.05 * totalShopLevels) * (1 - 0.1 * totalRecruits));
            totalEarned *= taxMultiplier;
            const currentBalance = userData.balance || 0;
            totalEarned = Math.min(totalEarned, currentBalance + totalEarned >= 0 ? totalEarned : currentBalance);
            totalEarnings += totalEarned;
            if (totalEarned > 0) {
              const timeDisplay = targetBranches.length === 1 ? "1 minute" : "various durations";
              message += `Collected from ${targetBranches.length} branch(es) for ${timeDisplay}:\n` +
                Object.entries(totalCollectedServices)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                  .join("\n") +
                `\nTaxes: ${Math.round((1 - (1 - 0.05 * totalShopLevels)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * totalRecruits)) * 100)}% salary tax (capped at 90% total)` +
                `\nTotal: $${totalEarned.toLocaleString("en-US")}\n`;
            }
            const startTime = Date.now();
            for (const branch of targetBranches) {
              branch.active = true;
              branch.startTime = startTime;
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance + totalEarned,
              salon: {
                branches,
                lastCollectionTime: userData.salon.lastCollectionTime || 0,
                totalEarnings,
              },
            });
            message += `Started ${targetBranches.length} branch(es): ${targetBranches.map(b => `Branch ${b.branchId} (Level ${b.shopLevel} 🏬${b.recruits ? `, ${b.recruits} Level ${b.recruitLevel} stylist(s) 👩‍💼` : ""})`).join(", ")}! Use 'salon collect' to gather earnings.`;
            await chat.reply(message);
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "property"],
          description: "Buy your first Starter Salon to start your business.",
          usage: "salon buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.salon?.branches?.length > 0) {
              return await chat.reply(
                `You already own ${userData.salon.branches.length} salon branch(es)! Use 'salon branch' to open more or 'salon upgrade' to improve existing ones.`
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
                branches: [{
                  branchId: 1,
                  active: false,
                  startTime: 0,
                  shopLevel: 1,
                  recruits: 0,
                  recruitLevel: 0,
                  collectedServices: { basic: 0, premium: 0, luxury: 0 },
                }],
                lastCollectionTime: 0,
                totalEarnings: 0,
              },
            });
            await chat.reply(
              `Successfully purchased a Starter Salon 🏬 (Branch 1) for $${cost.toLocaleString("en-US")}! You'll pay a 5% property tax per shop level (capped at 90% total tax). Use 'salon start' to begin. Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "branch",
          aliases: ["openbranch", "expand"],
          description: "Open a new salon branch to increase earnings.",
          usage: "salon branch",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const branches = userData.salon.branches;
            if (branches.length >= 5) {
              return await chat.reply(
                "You have reached the maximum of 5 salon branches!"
              );
            }
            const cost = 10000 * branches.length;
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to open a new branch, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            const newBranchId = branches.length + 1;
            branches.push({
              branchId: newBranchId,
              active: false,
              startTime: 0,
              shopLevel: 1,
              recruits: 0,
              recruitLevel: 0,
              collectedServices: { basic: 0, premium: 0, luxury: 0 },
            });
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                branches,
                lastCollectionTime: userData.salon.lastCollectionTime || 0,
                totalEarnings: userData.salon.totalEarnings || 0,
              },
            });
            await chat.reply(
              `Successfully opened Branch ${newBranchId} 🏬 for $${cost.toLocaleString("en-US")}! You now have ${branches.length} branch(es). Use 'salon start ${newBranchId}' to begin. Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "stylist"],
          description: "Recruit a stylist for a specific branch to boost earnings.",
          usage: "salon recruit <branchId>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            if (!args[0] || isNaN(parseInt(args[0]))) {
              return await chat.reply(
                `Please specify a valid branch ID (e.g., salon recruit 1). Available branches: ${userData.salon.branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const branchId = parseInt(args[0]);
            const branch = userData.salon.branches.find(b => b.branchId === branchId);
            if (!branch) {
              return await chat.reply(
                `Invalid branch ID. Please use a number between 1 and ${userData.salon.branches.length}. Available branches: ${userData.salon.branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const currentRecruits = branch.recruits || 0;
            if (currentRecruits >= 10) {
              return await chat.reply(
                `Branch ${branchId} has reached the maximum of 10 stylists!`
              );
            }
            const cost = 1000 * (currentRecruits + 1);
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to recruit a stylist for Branch ${branchId}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            branch.recruits = currentRecruits + 1;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                ...userData.salon,
                branches: userData.salon.branches,
              },
            });
            const newMultiplier = 2 + 0.5 * (currentRecruits + 1);
            await chat.reply(
              `Successfully recruited a stylist 👩‍💼 for Branch ${branchId} for $${cost.toLocaleString("en-US")}! Branch ${branchId} now has ${currentRecruits + 1} stylist(s), boosting earnings to ${newMultiplier}x but adding a 10% salary tax per stylist (capped at 90% total tax). Your new balance is $${(currentBalance - cost).toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check progress and estimated earnings for one or all salon branches.",
          usage: "salon status [branchId]",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const branchId = parseInt(args[0]) || 0;
            const branches = userData.salon.branches;
            if (branchId && !branches.find(b => b.branchId === branchId)) {
              return await chat.reply(
                `Invalid branch ID. Please use a number between 1 and ${branches.length}. Available branches: ${branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const targetBranches = branchId ? branches.filter(b => b.branchId === branchId) : branches;
            let message = `Salon Status (${targetBranches.length} branch(es)):\n`;
            let totalEarned = 0;
            let totalCollectedServices = { basic: 0, premium: 0, luxury: 0 };
            const totalShopLevels = branches.reduce((sum, b) => sum + b.shopLevel, 0);
            const totalRecruits = branches.reduce((sum, b) => sum + (b.recruits || 0), 0);
            const taxMultiplier = Math.max(0.1, (1 - 0.05 * totalShopLevels) * (1 - 0.1 * totalRecruits));
            for (const branch of targetBranches) {
              message += `\nBranch ${branch.branchId}: Level ${branch.shopLevel} 🏬${branch.recruits ? ` with ${branch.recruits} Level ${branch.recruitLevel} stylist(s) 👩‍💼` : ""}\n`;
              if (!branch.active || !branch.startTime) {
                message += "Status: Not currently operating. Use 'salon start' to begin.\n";
                continue;
              }
              const timeElapsed = (Date.now() - branch.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed < 0) {
                branch.active = false;
                branch.startTime = 0;
                message += "Status: Invalid session. Use 'salon start' to begin.\n";
                continue;
              }
              const { totalEarned: branchEarned, collectedServices } = calculateEarnings(branch, timeElapsed);
              totalEarned += branchEarned;
              for (const [service, quantity] of Object.entries(collectedServices)) {
                totalCollectedServices[service] = (totalCollectedServices[service] || 0) + quantity;
              }
              message += `Status: Operating for ${timeElapsed < 1 ? `${Math.floor(timeElapsed * 60)} seconds` : `${Math.floor(timeElapsed)} minutes`}\n` +
                        `Estimated Services:\n` +
                        (Object.keys(collectedServices).some(s => collectedServices[s] > 0)
                          ? Object.entries(collectedServices)
                              .filter(([_, quantity]) => quantity > 0)
                              .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                              .join("\n")
                          : "No services performed yet.") +
                        `\n`;
            }
            totalEarned *= taxMultiplier;
            message += `\nTotal Taxes: ${Math.round((1 - (1 - 0.05 * totalShopLevels)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * totalRecruits)) * 100)}% salary tax (capped at 90% total)` +
                      `\nTotal Estimated Earnings: $${totalEarned.toLocaleString("en-US")}`;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              salon: {
                ...userData.salon,
                branches,
              },
            });
            await chat.reply(message);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "earn"],
          description: "Collect earnings from one or all salon branches.",
          usage: "salon collect [branchId]",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            const branchId = parseInt(args[0]) || 0;
            const branches = userData.salon.branches;
            if (branchId && !branches.find(b => b.branchId === branchId)) {
              return await chat.reply(
                `Invalid branch ID. Please use a number between 1 and ${branches.length}. Available branches: ${branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const lastCollectionTime = userData.salon.lastCollectionTime || 0;
            if (Date.now() - lastCollectionTime < 60000) {
              return await chat.reply(
                "No services performed yet. Come back after a minute or an hour for the collection."
              );
            }
            const targetBranches = branchId ? branches.filter(b => b.branchId === branchId) : branches;
            let totalEarned = 0;
            let totalCollectedServices = { basic: 0, premium: 0, luxury: 0 };
            const totalShopLevels = branches.reduce((sum, b) => sum + b.shopLevel, 0);
            const totalRecruits = branches.reduce((sum, b) => sum + (b.recruits || 0), 0);
            const taxMultiplier = Math.max(0.1, (1 - 0.05 * totalShopLevels) * (1 - 0.1 * totalRecruits));
            for (const branch of targetBranches) {
              if (!branch.active || !branch.startTime) {
                continue;
              }
              const timeElapsed = (Date.now() - branch.startTime) / 1000 / 60;
              if (isNaN(timeElapsed) || timeElapsed <= 0) {
                branch.active = false;
                branch.startTime = 0;
                continue;
              }
              const { totalEarned: branchEarned, collectedServices } = calculateEarnings(branch, timeElapsed);
              totalEarned += branchEarned;
              for (const [service, quantity] of Object.entries(collectedServices)) {
                totalCollectedServices[service] = (totalCollectedServices[service] || 0) + quantity;
              }
              branch.collectedServices = { basic: 0, premium: 0, luxury: 0 };
            }
            totalEarned *= taxMultiplier;
            const currentBalance = userData.balance || 0;
            totalEarned = Math.min(totalEarned, currentBalance + totalEarned >= 0 ? totalEarned : currentBalance);
            const newBalance = currentBalance + totalEarned;
            const newStartTime = Date.now();
            for (const branch of targetBranches) {
              if (branch.active) {
                branch.startTime = newStartTime;
              }
            }
            const totalEarnings = (userData.salon.totalEarnings || 0) + totalEarned;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              salon: {
                branches,
                lastCollectionTime: newStartTime,
                totalEarnings,
              },
            });
            const timeDisplay = targetBranches.length === 1 ? "1 minute" : "various durations";
            const replyMessage = `Operated ${targetBranches.length} branch(es) for ${timeDisplay}:\n` +
              Object.entries(totalCollectedServices)
                .filter(([_, quantity]) => quantity > 0)
                .map(([service, quantity]) => `${services[service].name} ${services[service].emoji}: ${quantity} services worth $${(quantity * services[service].value).toLocaleString("en-US")}`)
                .join("\n") +
              `\nTaxes: ${Math.round((1 - (1 - 0.05 * totalShopLevels)) * 100)}% property tax, ${Math.round((1 - (1 - 0.1 * totalRecruits)) * 100)}% salary tax (capped at 90% total)` +
              `\nTotal: $${totalEarned.toLocaleString("en-US")}\nYour new balance is $${newBalance.toLocaleString("en-US")}.`;
            await chat.reply(replyMessage);
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["expand", "improve"],
          description: "Upgrade a specific salon branch and its stylists for higher earnings.",
          usage: "salon upgrade <branchId>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon || !userData.salon.branches || userData.salon.branches.length === 0) {
              return await chat.reply(
                "You need to buy a salon first! Use 'salon buy' to purchase a Starter Salon."
              );
            }
            if (!args[0] || isNaN(parseInt(args[0]))) {
              return await chat.reply(
                `Please specify a valid branch ID (e.g., salon upgrade 1). Available branches: ${userData.salon.branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const branchId = parseInt(args[0]);
            const branch = userData.salon.branches.find(b => b.branchId === branchId);
            if (!branch) {
              return await chat.reply(
                `Invalid branch ID. Please use a number between 1 and ${userData.salon.branches.length}. Available branches: ${userData.salon.branches.map(b => b.branchId).join(", ")}.`
              );
            }
            const shopLevel = branch.shopLevel;
            const recruits = branch.recruits || 0;
            const recruitLevel = branch.recruitLevel || 0;
            const shopUpgradeCost = 5000 * Math.pow(2, shopLevel - 1) * (recruits + 1);
            const recruitUpgradeCost = recruits > 0 ? 2000 * Math.pow(2, recruitLevel - 1) * recruits : 0;
            const totalCost = shopUpgradeCost + recruitUpgradeCost;
            const currentBalance = userData.balance || 0;
            if (currentBalance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString("en-US")} to upgrade Branch ${branchId}${recruits > 0 ? " and its stylists" : ""}, but you only have $${currentBalance.toLocaleString("en-US")}! (Shop: $${shopUpgradeCost.toLocaleString("en-US")}${recruits > 0 ? `, Stylists: $${recruitUpgradeCost.toLocaleString("en-US")}` : ""})`
              );
            }
            branch.shopLevel += 1;
            if (recruits > 0) {
              branch.recruitLevel += 1;
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - totalCost,
              salon: {
                ...userData.salon,
                branches: userData.salon.branches,
              },
            });
            let message = `Successfully upgraded Branch ${branchId} to Level ${branch.shopLevel} 🏬 for $${shopUpgradeCost.toLocaleString("en-US")}!`;
            if (recruits > 0) {
              message += ` Its ${recruits} stylist(s) upgraded to Level ${branch.recruitLevel} 👩‍💼 for $${recruitUpgradeCost.toLocaleString("en-US")}.`;
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
