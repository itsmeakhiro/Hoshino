/**
 * @type {HoshinoLia.Command}
 */

const command = {
  manifest: {
    name: "resort",
    aliases: ["rsrt"],
    version: "1.2",
    developer: "Francis Loyd Raval",
    description:
      "Manage your resort: buy land, start operations, check status, collect earnings, construct facilities, recruit staff, and upgrade for more popularity and faster earnings.",
    category: "Simulation",
    usage:
      "resort buy | resort start | resort status | resort collect | resort construct <facility> | resort recruit <role> | resort upgrade",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🏝️ 〙 RESORT",
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
            const referenceTime = resort.lastCollected > 0 ? resort.lastCollected : resort.startedAt;
            const hoursSinceLastCollect =
              resort.status === "running" && referenceTime > 0
                ? (Date.now() - referenceTime) / (1000 * 60 * 60)
                : 0;
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
            const referenceTime = resort.lastCollected > 0 ? resort.lastCollected : resort.startedAt;
            const hoursSinceLastCollect =
              referenceTime > 0
                ? (Date.now() - referenceTime) / (1000 * 60 * 60)
                : 0;
            const earnings = Math.round(totalEarningsPerHour * hoursSinceLastCollect);
            if (earnings <= 0) {
              return await chat.reply("No earnings to collect yet! Wait a bit longer.");
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance + earnings,
              resort: { ...resort, lastCollected: Date.now() },
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
            if (args.length < 1 || !facilities[args[0].toLowerCase()]) {
              return await chat.reply(
                `Please specify a valid facility: hotel, golf, bar, spa, pool, or restaurant. Usage: resort construct <facility>`
              );
            }
            const facility = args[0].toLowerCase();
            const { cost, tax } = facilities[facility];
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.facilities.includes(facility)) {
              return await chat.reply(`You already have a ${facility}!`);
            }
            const totalCost = cost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${cost.toLocaleString()} + $${tax.toLocaleString()} tax) to construct a ${facility}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                facilities: [...userData.resort.facilities, facility],
              },
            });
            console.log(`User ${event.senderID} constructed a ${facility} for $${totalCost}`);
            await chat.reply(
              `Constructed a ${facility} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Earnings increased.`
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
            if (args.length < 1 || !staffRoles[args[0].toLowerCase()]) {
              return await chat.reply(
                `Please specify a valid role: cashier, janitor, housekeeper, chef, security, or entertainer. Usage: resort recruit <role>`
              );
            }
            const role = args[0].toLowerCase();
            const { cost, tax } = staffRoles[role];
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            if (userData.resort.staff.includes(role)) {
              return await chat.reply(`You already have a ${role}!`);
            }
            const totalCost = cost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${cost.toLocaleString()} + $${tax.toLocaleString()} salary) to recruit a ${role}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                staff: [...userData.resort.staff, role],
              },
            });
            console.log(`User ${event.senderID} recruited a ${role} for $${totalCost}`);
            await chat.reply(
              `Recruited a ${role} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} salary)! Earnings increased.`
            );
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["lvlup"],
          description: "Upgrade your resort to increase earnings and speed up the process.",
          usage: "resort upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            const upgradeCost = 10000 * userData.resort.level;
            const tax = Math.round(upgradeCost * 0.1);
            const totalCost = upgradeCost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${upgradeCost.toLocaleString()} + $${tax.toLocaleString()} tax) to upgrade your resort!`
              );
            }
            const newLevel = userData.resort.level + 1;
            const newMultiplier = 1.0 + (newLevel - 1) * 0.5;
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                level: newLevel,
                multiplier: newMultiplier,
              },
            });
            console.log(`User ${event.senderID} upgraded resort to level ${newLevel} with ${newMultiplier}x multiplier for $${totalCost}`);
            await chat.reply(
              `Upgraded your resort to level ${newLevel} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Earnings increased and process sped up to ${newMultiplier.toFixed(1)}x.`
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