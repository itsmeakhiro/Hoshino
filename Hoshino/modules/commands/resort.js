/**
 * @type {HoshinoLia.Command}
 */
const command = {
  manifest: {
    name: "resort",
    aliases: ["rsrt"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Manage your resort: buy land, start operations, check status, collect earnings, construct facilities, recruit staff, and upgrade for more popularity.",
    category: "Economy",
    usage:
      "resort buy | resort start | resort status | resort collect | resort construct <facility> | resort recruit <role> | resort upgrade",
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
            const tax = Math.round(landPrice * 0.1); // 10% tax
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
              },
            });
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
              resort: { ...userData.resort, status: "running" },
            });
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
            const totalEarningsPerHour =
              baseEarningsPerHour + facilityBonus + staffBonus;
            const hoursSinceLastCollect =
              resort.lastCollected > 0
                ? (Date.now() - resort.lastCollected) / (1000 * 60 * 60)
                : 0;
            const pendingEarnings = resort.status === "running"
              ? Math.round(totalEarningsPerHour * hoursSinceLastCollect)
              : 0;

            const statusInfo = [
              `Resort Level: ${resort.level}`,
              `Status: ${resort.status.charAt(0).toUpperCase() + resort.status.slice(1)}`,
              `Facilities: ${resort.facilities.length > 0 ? resort.facilities.join(", ") : "None"}`,
              `Staff: ${resort.staff.length > 0 ? resort.staff.join(", ") : "None"}`,
              `Earnings Rate: $${totalEarningsPerHour.toLocaleString()}/hour`,
              `Pending Earnings: $${pendingEarnings.toLocaleString()}`,
              `Last Collected: ${resort.lastCollected > 0 ? new Date(resort.lastCollected).toLocaleString() : "Never"}`,
            ].join("\n");
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
            const totalEarningsPerHour =
              baseEarningsPerHour + facilityBonus + staffBonus;
            const hoursSinceLastCollect =
              resort.lastCollected > 0
                ? (Date.now() - resort.lastCollected) / (1000 * 60 * 60)
                : 0;
            const earnings = Math.round(totalEarningsPerHour * hoursSinceLastCollect);
            if (earnings <= 0) {
              return await chat.reply("No earnings to collect yet!");
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance + earnings,
              resort: { ...resort, lastCollected: Date.now() },
            });
            await chat.reply(
              `Collected $${earnings.toLocaleString()} from your resort!`
            );
          },
        },
        {
          subcommand: "construct",
          aliases: ["build"],
          description: "Construct facilities to increase earnings (with maintenance tax).",
          usage: "resort construct <hotel|golf|bar>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const facilities = {
              hotel: { cost: 5000, tax: 100 },
              golf: { cost: 8000, tax: 150 },
              bar: { cost: 3000, tax: 50 },
            };
            if (args.length < 1 || !facilities[args[0].toLowerCase()]) {
              return await chat.reply(
                `Please specify a valid facility: hotel, golf, or bar. Usage: resort construct <facility>`
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
            await chat.reply(
              `Constructed a ${facility} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Earnings increased.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire"],
          description: "Recruit staff to boost earnings (with salary tax).",
          usage: "resort recruit <cashier|janitor|housekeeper>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const staffRoles = {
              cashier: { cost: 2000, tax: 50 },
              janitor: { cost: 1500, tax: 30 },
              housekeeper: { cost: 1800, tax: 40 },
            };
            if (args.length < 1 || !staffRoles[args[0].toLowerCase()]) {
              return await chat.reply(
                `Please specify a valid role: cashier, janitor, or housekeeper. Usage: resort recruit <role>`
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
            await chat.reply(
              `Recruited a ${role} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} salary)! Earnings increased.`
            );
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["lvlup"],
          description: "Upgrade your resort to double earnings (increases popularity).",
          usage: "resort upgrade",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.resort) {
              return await chat.reply(
                "You need to buy a resort first! Use: resort buy"
              );
            }
            const upgradeCost = 10000 * userData.resort.level;
            const tax = Math.round(upgradeCost * 0.1); // 10% tax
            const totalCost = upgradeCost + tax;
            if (userData.balance < totalCost) {
              return await chat.reply(
                `You need $${totalCost.toLocaleString()} ($${upgradeCost.toLocaleString()} + $${tax.toLocaleString()} tax) to upgrade your resort!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: userData.balance - totalCost,
              resort: {
                ...userData.resort,
                level: userData.resort.level + 1,
              },
            });
            await chat.reply(
              `Upgraded your resort to level ${userData.resort.level + 1} for $${totalCost.toLocaleString()} (including $${tax.toLocaleString()} tax)! Earnings doubled.`
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