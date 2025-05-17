const { cleanUserID } = global.Hoshino.utils;

const FARE_TYPES = [
  { name: "Standard Ride", emoji: "🚶", value: 20, tier: "low" },
  { name: "Express Ride", emoji: "🚗", value: 50, tier: "mid" },
  { name: "VIP Ride", emoji: "🌟", value: 100, tier: "high" },
];

const VEHICLE_TIERS = {
  old_normal_taxi: { cost: 1000, minLevel: 1, multiplier: 1, emoji: "🚕", accessibleFares: ["low"] },
  refurbished_taxi: { cost: 0, minLevel: 10, multiplier: 1.5, emoji: "🚖", accessibleFares: ["low", "mid"] },
  modern_taxi: { cost: 0, minLevel: 20, multiplier: 2, emoji: "🚗", accessibleFares: ["low", "mid", "high"] },
  luxury_taxi: { cost: 0, minLevel: 30, multiplier: 2.5, emoji: "🚘", accessibleFares: ["low", "mid", "high"] },
  tesla_cybercab: { cost: 0, minLevel: 40, multiplier: 3, emoji: "🤖", accessibleFares: ["low", "mid", "high"] },
};

const vehicleOrder = ["old_normal_taxi", "refurbished_taxi", "modern_taxi", "luxury_taxi", "tesla_cybercab"];

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "taxi",
    aliases: ["cab"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "Run a taxi service to earn money by completing passenger rides. Buy an Old Normal Taxi to start, and it upgrades to new branded models (e.g., Tesla Cybercab at level 40) as your level increases, boosting earnings with better fares and multipliers.",
    category: "Economy",
    usage: "taxi start | taxi status | taxi collect | taxi buy",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🚖 〙 TAXI",
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
          subcommand: "start",
          aliases: ["begin", "s"],
          description: "Start your taxi service to earn money.",
          usage: "taxi start",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.vehicleType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            if (userData.taxiStartTime) {
              return await chat.reply(
                "Taxi service is already active! Use 'taxi status' to check progress or 'taxi collect' to claim earnings."
              );
            }
            const vehicleType = userData.vehicleType || "old_normal_taxi";
            const accessibleFares = VEHICLE_TIERS[vehicleType].accessibleFares;
            const fare = FARE_TYPES.find((f) => accessibleFares.includes(f.tier)) || FARE_TYPES[0];
            const taxiLevel = userData.taxiLevel || 0;
            const levelMultiplier = 1 + taxiLevel * 0.05;
            const vehicleMultiplier = VEHICLE_TIERS[vehicleType].multiplier;
            const earnings = fare.value * levelMultiplier * vehicleMultiplier;
            await hoshinoDB.set(userID, {
              ...userData,
              taxiStartTime: Date.now(),
              taxiRides: { [fare.name.toLowerCase().replace(/\s+/g, "")]: 1 },
              pendingEarnings: earnings,
            });
            await chat.reply(
              `Started your taxi service with a ${vehicleType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${VEHICLE_TIERS[vehicleType].emoji}! Completed a ${fare.name} for $${earnings.toLocaleString("en-US")}.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your taxi service progress and earnings.",
          usage: "taxi status",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.vehicleType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            const {
              balance = 0,
              taxiStartTime = null,
              taxiRides = {},
              pendingEarnings = 0,
              taxiLevel = 0,
              vehicleType = "old_normal_taxi",
              username,
              gameid = "N/A",
            } = userData;
            if (!taxiStartTime) {
              return await chat.reply(
                "You are not operating a taxi. Start with: taxi start"
              );
            }
            let newVehicleType = vehicleType;
            let upgradeMessage = "";
            for (const tier of vehicleOrder) {
              if (taxiLevel >= VEHICLE_TIERS[tier].minLevel && vehicleOrder.indexOf(tier) > vehicleOrder.indexOf(newVehicleType)) {
                newVehicleType = tier;
                upgradeMessage = `Your taxi upgraded to a ${newVehicleType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${VEHICLE_TIERS[newVehicleType].emoji}! Now earning x${VEHICLE_TIERS[newVehicleType].multiplier} fares.`;
              }
            }
            // Complete a new ride
            const accessibleFares = VEHICLE_TIERS[newVehicleType].accessibleFares;
            const fare = FARE_TYPES.find((f) => accessibleFares.includes(f.tier)) || FARE_TYPES[0];
            const levelMultiplier = 1 + taxiLevel * 0.05;
            const vehicleMultiplier = VEHICLE_TIERS[newVehicleType].multiplier;
            const newEarnings = fare.value * levelMultiplier * vehicleMultiplier;
            const updatedRides = { ...taxiRides };
            const fareKey = fare.name.toLowerCase().replace(/\s+/g, "");
            updatedRides[fareKey] = (updatedRides[fareKey] || 0) + 1;
            const totalEarnings = pendingEarnings + newEarnings;
            await hoshinoDB.set(userID, {
              ...userData,
              taxiRides: updatedRides,
              pendingEarnings: totalEarnings,
              vehicleType: newVehicleType,
            });
            const rideLines = FARE_TYPES.map((f) => {
              const key = f.name.toLowerCase().replace(/\s+/g, "");
              const count = updatedRides[key] || 0;
              return count > 0
                ? `${f.emoji} ${f.name}: ${count} ($${f.value.toLocaleString("en-US")} each)`
                : null;
            }).filter((line): line is string => line !== null);
            const accessibleFaresText = FARE_TYPES.filter((f) =>
              accessibleFares.includes(f.tier)
            ).map((f) => `${f.emoji} ${f.name} ($${f.value.toLocaleString("en-US")})`);
            const minutesElapsed = Math.floor((Date.now() - taxiStartTime) / 60000);
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Operating taxi for ${minutesElapsed} minute(s).`,
              `Taxi Level: ${taxiLevel} (x${(levelMultiplier * vehicleMultiplier).toFixed(1)} total earnings multiplier)`,
              `Vehicle: ${newVehicleType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${VEHICLE_TIERS[newVehicleType].emoji}`,
              `Accessible Fares: ${accessibleFaresText.join(", ")}`,
              `Completed Rides:`,
              rideLines.length > 0 ? rideLines.join("\n") : "No rides completed yet.",
              `Total Pending Earnings: $${totalEarnings.toLocaleString("en-US")}`,
            ];
            if (upgradeMessage) {
              infoLines.push(upgradeMessage);
            }
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "c"],
          description: "Collect your earnings and continue taxi service.",
          usage: "taxi collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.vehicleType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            const {
              balance = 0,
              taxiStartTime = null,
              taxiRides = {},
              pendingEarnings = 0,
              taxiLevel = 0,
              vehicleType = "old_normal_taxi",
            } = userData;
            if (!taxiStartTime) {
              return await chat.reply(
                "You are not operating a taxi. Start with: taxi start"
              );
            }
            // Check for vehicle upgrade
            let newVehicleType = vehicleType;
            let upgradeMessage = "";
            for (const tier of vehicleOrder) {
              if (taxiLevel >= VEHICLE_TIERS[tier].minLevel && vehicleOrder.indexOf(tier) > vehicleOrder.indexOf(newVehicleType)) {
                newVehicleType = tier;
                upgradeMessage = `Your taxi upgraded to a ${newVehicleType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${VEHICLE_TIERS[newVehicleType].emoji}! Now earning x${VEHICLE_TIERS[newVehicleType].multiplier} fares.`;
              }
            }
            const accessibleFares = VEHICLE_TIERS[newVehicleType].accessibleFares;
            const fare = FARE_TYPES.find((f) => accessibleFares.includes(f.tier)) || FARE_TYPES[0];
            const levelMultiplier = 1 + taxiLevel * 0.05;
            const vehicleMultiplier = VEHICLE_TIERS[newVehicleType].multiplier;
            const newEarnings = fare.value * levelMultiplier * vehicleMultiplier;
            const updatedRides = { ...taxiRides };
            const fareKey = fare.name.toLowerCase().replace(/\s+/g, "");
            updatedRides[fareKey] = (updatedRides[fareKey] || 0) + 1;
            const totalEarnings = pendingEarnings + newEarnings;
            const rideLines = FARE_TYPES.map((f) => {
              const key = f.name.toLowerCase().replace(/\s+/g, "");
              const count = updatedRides[key] || 0;
              return count > 0
                ? `${f.emoji} ${f.name}: ${count} ($${f.value.toLocaleString("en-US")} each)`
                : null;
            }).filter((line): line is string => line !== null);
            const infoLines: string[] = [];
            if (totalEarnings > 0) {
              infoLines.push(
                `Collected $${totalEarnings.toLocaleString("en-US")} from taxi rides!`
              );
              infoLines.push("Rides completed:");
              infoLines.push(...rideLines);
            } else {
              infoLines.push("No earnings from taxi rides.");
            }
            if (upgradeMessage) {
              infoLines.push(upgradeMessage);
            }
            infoLines.push("Taxi service continues with a new ride!");
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + totalEarnings,
              taxiStartTime: Date.now(),
              taxiRides: { [fareKey]: 1 },
              pendingEarnings: newEarnings,
              vehicleType: newVehicleType,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "buy",
          aliases: ["purchase", "b"],
          description: "Buy your first taxi to start the service.",
          usage: "taxi buy",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, vehicleType } = userData;
            if (vehicleType) {
              return await chat.reply(
                `You already own a ${vehicleType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}! Your taxi upgrades automatically as your level increases (next upgrade at level ${VEHICLE_TIERS[vehicleOrder[vehicleOrder.indexOf(vehicleType) + 1]]?.minLevel || "max"}).`
              );
            }
            const vehicle = "old_normal_taxi";
            const vehicleData = VEHICLE_TIERS[vehicle];
            if (balance < vehicleData.cost) {
              return await chat.reply(
                `You need $${vehicleData.cost.toLocaleString("en-US")} to buy an Old Normal Taxi! Current balance: $${balance.toLocaleString("en-US")}.`
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - vehicleData.cost,
              vehicleType: vehicle,
            });
            const accessibleFares = FARE_TYPES.filter((f) =>
              vehicleData.accessibleFares.includes(f.tier)
            ).map((f) => `${f.emoji} ${f.name} ($${f.value.toLocaleString("en-US")})`);
            await chat.reply(
              `Purchased an Old Normal Taxi ${vehicleData.emoji} for $${vehicleData.cost.toLocaleString("en-US")}! You can now earn: ${accessibleFares.join(", ")} with x${vehicleData.multiplier} earnings. Use 'taxi start' to begin!`
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
