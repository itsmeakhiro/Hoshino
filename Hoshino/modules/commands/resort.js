/**
 * @type {HoshinoLia.Command} 
 */

const command = {
  manifest: {
    name: "resort",
    aliases: ["rsrt"],
    version: "1.4",
    developer: "Francis Loyd Raval",
    description:
      "Manage your resort: buy land, start operations, check status, collect earnings, construct facilities, recruit staff, and upgrade for more popularity and faster earnings.",
    category: "Economy",
    usage:
      "resort buy | resort start | resort status | resort collect | resort construct <facility> | resort recruit <role> | resort upgrade [targetLevel]",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🏝️ 〙 RESORT SIMULATION",
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
          description: "Buy a land for your resort with a 10% tax.",
          usage: "resort buy",
          async deploy({ chat, event, hoshinoDB, HoshinoUser }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (userData.resort) {
              return await chat.reply("You already own a resort!");
            }
            const landPrice = 10000;
            const tax = Math.round(landPrice * 0.1);
            const totalCost = landPrice + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${landPrice.toLocaleString()} + $${tax.toLocaleString()} tax) to buy a resort!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                level: 1,
                facilities: [],
                staff: [],
                earnings: 0,
                status: "idle",
                lastCollected: 0,
                startedAt: 0,
                multiplier: 1.0,
              },
            });
            console.log(`User ${event.senderID} bought a resort for $${totalCost}`);
            await chat.reply(
              `Successfully bought a resort for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Use 'resort start' to begin operations.`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin"],
          description: "Start your resort operations to earn money.",
          usage: "resort start",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.status === "running") {
              return await chat.reply("Your resort is already running!");
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              resort: {
                ...userData.resort,
                status: "running",
                startedAt: userData.resort.startedAt === 0 ? Date.now() : userData.resort.startedAt,
              },
            });
            console.log(`User ${event.senderID} started their resort`);
            await chat.reply(
              "Your resort is now operational! Earnings will accumulate over time. Check with 'resort status'."
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["check", "stats"],
          description: "Check the status and progress of your resort.",
          usage: "resort status",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            const { resort } = userData;
            const baseEarningsPerHour = 1000 * resort.level;
            const facilityBonus = resort.facilities.length * 200;
            const staffBonus = resort.staff.length * 100;
            const totalEarningsPerHour = Math.round(
              (baseEarningsPerHour + facilityBonus + staffBonus) * resort.multiplier
            );
            const now = Date.now();
            const referenceTime = resort.lastCollected > 0 && resort.lastCollected <= now ? resort.lastCollected : resort.startedAt;
            const hoursSinceLastCollect =
              resort.status === "running" && referenceTime > 0 && referenceTime <= now
                ? (now - referenceTime) / (1000 * 60 * 60)
                : 0;
            console.log(`User ${event.senderID} status: hoursSinceLastCollect=${hoursSinceLastCollect}, referenceTime=${referenceTime}`);
            const pendingEarnings = resort.status === "running"
              ? Math.round(totalEarningsPerHour * hoursSinceLastCollect)
              : 0;
            const statusInfo = [
              `Resort Level: ${resort.level}`,
              `Earnings Multiplier: ${resort.multiplier.toFixed(1)}x`,
              `Status: ${resort.status.charAt(0).toUpperCase() + resort.status.slice(1)}`,
              `Facilities: ${resort.facilities.length > 0 ? resort.facilities.join(", ") : "None"}`,
              `Staff: ${resort.staff.length > 0 ? resort.staff.join(", ") : "None"}`,
              `Earnings Rate: $${totalEarningsPerHour.toLocaleString()}/hour`,
              `Pending Earnings: $${pendingEarnings.toLocaleString()}`,
              `Last Collected: ${resort.lastCollected > 0 ? new Date(resort.lastCollected).toLocaleString() : "Never"}`,
            ].join("\n");
            console.log(`User ${event.senderID} checked resort status: ${statusInfo}`);
            await chat.reply(statusInfo);
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim"],
          description: "Collect your resort's accumulated earnings.",
          usage: "resort collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.status !== "running") {
              return await chat.reply(
                "Your resort must be running to collect earnings! Use: resort start"
              );
            }
            const { resort } = userData;
            const baseEarningsPerHour = 1000 * resort.level;
            const facilityBonus = resort.facilities.length * 200;
            const staffBonus = resort.staff.length * 100;
            const totalEarningsPerHour = Math.round(
              (baseEarningsPerHour + facilityBonus + staffBonus) * resort.multiplier
            );
            const now = Date.now();
            const referenceTime = resort.lastCollected > 0 && resort.lastCollected <= now ? resort.lastCollected : resort.startedAt;
            const hoursSinceLastCollect =
              referenceTime > 0 && referenceTime <= now
                ? (now - referenceTime) / (1000 * 60 * 60)
                : 0;
            console.log(`User ${event.senderID} collect: hoursSinceLastCollect=${hoursSinceLastCollect}, referenceTime=${referenceTime}`);
            const earnings = Math.round(totalEarningsPerHour * hoursSinceLastCollect);
            if (earnings <= 0) {
              return await chat.reply("No earnings to collect yet! Wait a bit longer.");
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance + earnings,
              resort: { ...resort, lastCollected: now },
            });
            console.log(`User ${event.senderID} collected $${earnings} from resort`);
            await chat.reply(
              `Collected $${earnings.toLocaleString()} from your resort!`
            );
          },
        },
        {
          subcommand: "construct",
          aliases: ["build"],
          description: "Construct facilities to increase earnings (with maintenance tax).",
          usage: "resort construct <hotel|golf|bar|spa|pool|restaurant>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const facilities = {
              hotel: { cost: 5000, tax: 100 },
              golf: { cost: 8000, tax: 150 },
              bar: { cost: 3000, tax: 50 },
              spa: { cost: 6000, tax: 120 },
              pool: { cost: 4000, tax: 80 },
              restaurant: { cost: 7000, tax: 140 },
            };
            const facilityInput = args.length > 0 ? args[0].trim().toLowerCase() : "";
            console.log(`User ${event.senderID} construct input: ${facilityInput}`);
            if (!facilityInput || !facilities[facilityInput]) {
              return await chat.reply(
                `Please specify a valid facility: hotel, golf, bar, spa, pool, or restaurant. Usage: resort construct <facility>`
              );
            }
            const { cost, tax } = facilities[facilityInput];
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.facilities.includes(facilityInput)) {
              return await chat.reply(`You already have a ${facilityInput}!`);
            }
            const totalCost = cost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${cost.toLocaleString()} + $${tax.toLocaleString()} tax) to construct a ${facilityInput}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                facilities: [...userData.resort.facilities, facilityInput],
              },
            });
            console.log(`User ${event.senderID} constructed a ${facilityInput} for $${totalCost}`);
            await chat.reply(
              `Constructed a ${facilityInput} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Earnings increased.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire"],
          description: "Recruit staff to boost earnings (with salary tax).",
          usage: "resort recruit <cashier|janitor|housekeeper|chef|security|entertainer>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const staffRoles = {
              cashier: { cost: 2000, tax: 50 },
              janitor: { cost: 1500, tax: 30 },
              housekeeper: { cost: 1800, tax: 40 },
              chef: { cost: 2500, tax: 60 },
              security: { cost: 2200, tax: 55 },
              entertainer: { cost: 2700, tax: 65 },
            };
            const roleInput = args.length > 0 ? args[0].trim().toLowerCase() : "";
            console.log(`User ${event.senderID} recruit input: ${roleInput}`);
            if (!roleInput || !staffRoles[roleInput]) {
              return await chat.reply(
                `Please specify a valid role: cashier, janitor, housekeeper, chef, security, or entertainer. Usage: resort recruit <role>`
              );
            }
            const { cost, tax } = staffRoles[roleInput];
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.staff.includes(roleInput)) {
              return await chat.reply(`You already have a ${roleInput}!`);
            }
            const totalCost = cost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${cost.toLocaleString()} + $${tax.toLocaleString()} salary) to recruit a ${roleInput}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                staff: [...userData.resort.staff, roleInput],
              },
            });
            console.log(`User ${event.senderID} recruited a ${roleInput} for $${totalCost}`);
            await chat.reply(
              `Recruited a ${roleInput} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} salary)! Earnings increased.`
            );
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["lvlup"],
          description: "Upgrade your resort to a target level to increase earnings and speed up the process.",
          usage: "resort upgrade [targetLevel]",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            const currentLevel = userData.resort.level;
            const targetLevelInput = args.length > 0 ? args[0].trim() : "";
            const targetLevel = targetLevelInput && !isNaN(parseFloat(targetLevelInput)) ? parseInt(targetLevelInput, 10) : currentLevel + 1;
            if (targetLevel <= currentLevel) {
              return await chat.reply(
                `Target level must be higher than current level (${currentLevel})!`
              );
            }
            if (targetLevel < 1) {
              return await chat.reply(
                `Target level must be a positive number!`
              );
            }
            let totalCost = 0;
            for (let i = currentLevel; i < targetLevel; i++) {
              const upgradeCost = 10000 * i;
              const tax = Math.round(upgradeCost * 0.1);
              totalCost += upgradeCost + tax;
            }
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} to upgrade to level ${targetLevel}!`
              );
            }
            const newMultiplier = 1.0 + (targetLevel - 1) * 0.5;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                level: targetLevel,
                multiplier: newMultiplier,
              },
            });
            console.log(`User ${event.senderID} upgraded resort to level ${targetLevel} with ${newMultiplier}x multiplier for $${totalCost}`);
            await chat.reply(
              `Upgraded your resort to level ${targetLevel} for $${totalCost.toLocaleString()}! Earnings increased and process sped up to ${newMultiplier.toFixed(1)}x.`
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