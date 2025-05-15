const { cleanUserID } = global.Hoshino.utils;

const TAXI_FARES = [
  { name: "Short Ride", emoji: "🚶", value: 50, tier: "common" },
  { name: "Local Trip", emoji: "🏠", value: 100, tier: "common" },
  { name: "City Tour", emoji: "🌆", value: 150, tier: "common" },
  { name: "Airport Run", emoji: "✈️", value: 200, tier: "uncommon" },
  { name: "Downtown Fare", emoji: "🏙️", value: 300, tier: "uncommon" },
  { name: "Night Shift", emoji: "🌙", value: 400, tier: "uncommon" },
  { name: "VIP Client", emoji: "👔", value: 600, tier: "rare" },
  { name: "Long-Distance Trip", emoji: "🛣️", value: 1000, tier: "rare" },
];

const TAXI_TIERS = {
  basic: { name: "Basic Taxi", emoji: "🚖", multiplierBoost: 0, minLevel: 0 },
  standard: { name: "Standard Cab", emoji: "🚕", multiplierBoost: 0.1, minLevel: 20 },
  luxury: { name: "Luxury Sedan", emoji: "🚗", multiplierBoost: 0.2, minLevel: 40 },
  premium: { name: "Premium SUV", emoji: "🚙", multiplierBoost: 0.3, minLevel: 60 },
  executive: { name: "Executive Limo", emoji: "🛻", multiplierBoost: 0.4, minLevel: 80 },
};

// DO NOT REMOVE HoshinoLia.Command, do not add types on async deploy ctx
const command: HoshinoLia.Command = {
  manifest: {
    name: "taxi",
    aliases: ["cab"],
    version: "1.1",
    developer: "Francis Loyd Raval",
    description:
      "Operate a taxi service to earn balance money by picking up passengers with fares from short rides ($50) to long-distance trips ($1,000). Buy a taxi, start your service, check progress, and collect earnings. Upgrade your taxi level to unlock better taxis with higher earnings. Taxi durability decreases with use, requiring future repairs.",
    category: "Economy",
    usage: "taxi buy | taxi start | taxi status | taxi collect",
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
          subcommand: "buy",
          aliases: ["purchase", "b"],
          description: "Buy your first taxi to start your service.",
          usage: "taxi buy",
          async deploy({ chat, event, hoshinoDB, args }) {
            console.log("Taxi buy args:", args); 
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, taxiType = null } = userData;
            if (taxiType) {
              return await chat.reply(
                `You already own a ${TAXI_TIERS[taxiType].name}! Use 'taxi start' to begin your service.`
              );
            }
            const cost = 5000;
            if (balance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString(
                  "en-US"
                )} to buy a Basic Taxi! Current balance: $${balance.toLocaleString(
                  "en-US"
                )}.`
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance - cost,
              taxiType: "basic",
              taxiDurability: 100,
              taxiLevel: 0,
              taxiUpgradeCost: 100,
              taxiMultiplierBoost: TAXI_TIERS.basic.multiplierBoost,
            });
            await chat.reply(
              `Purchased a Basic Taxi (🚖) for $${cost.toLocaleString(
                "en-US"
              )} with 100 durability! Use 'taxi start' to begin earning. Upgrade your taxi level to unlock better taxis with higher earnings.`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin", "s"],
          description: "Start your taxi service to earn balance money (remains active).",
          usage: "taxi start",
          async deploy({ chat, event, hoshinoDB }) {
            console.log("Taxi start args:", ctx.args); // Debug args
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.taxiType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            if (userData.taxiStartTime) {
              return await chat.reply(
                "Taxi service is already active! Use 'taxi status' to check progress or 'taxi collect' to claim earnings."
              );
            }
            await hoshinoDB.set(userID, {
              ...userData,
              taxiStartTime: Date.now(),
              taxiItems: {
                shortRide: 0,
                localTrip: 0,
                cityTour: 0,
                airportRun: 0,
                downtownFare: 0,
                nightShift: 0,
                vipClient: 0,
                longDistanceTrip: 0,
              },
            });
            const taxi = TAXI_TIERS[userData.taxiType];
            await chat.reply(
              `Started your taxi service with your ${taxi.name} (${
                taxi.emoji
              })! Earn money by picking up passengers like Short Rides ($50) or Long-Distance Trips ($1,000) with a 40% chance per minute. Your taxi has ${Math.floor(
                userData.taxiDurability
              )}/100 durability.`
            );
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "i"],
          description: "Check your taxi service progress and pending earnings.",
          usage: "taxi status",
          async deploy({ chat, event, hoshinoDB }) {
            console.log("Taxi status args:", ctx.args); 
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              taxiStartTime = null,
              taxiItems = {
                shortRide: 0,
                localTrip: 0,
                cityTour: 0,
                airportRun: 0,
                downtownFare: 0,
                nightShift: 0,
                vipClient: 0,
                longDistanceTrip: 0,
              },
              taxiLevel = 0,
              taxiDurability = 100,
              taxiType = null,
              taxiMultiplierBoost = 0,
              username,
              gameid = "N/A",
            } = userData;
            if (!taxiType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            if (!taxiStartTime) {
              return await chat.reply(
                "You are not driving a taxi. Start with: taxi start"
              );
            }
            const taxi = TAXI_TIERS[taxiType];
            const minutesElapsed = Math.floor(
              (Date.now() - taxiStartTime) / 60000
            );
            const itemsCollected = { ...taxiItems };
            let currentDurability = taxiDurability;
            const earningsMultiplier = 1 + taxiLevel * 0.3 + taxiMultiplierBoost;
            const tierWeights = {
              common: 0.6,
              uncommon: 0.3,
              rare: 0.1,
            };
            const totalWeight = Object.values(tierWeights).reduce(
              (sum, weight) => sum + weight,
              0
            );
            const itemProbabilities = TAXI_FARES.map((item) => ({
              ...item,
              probability: tierWeights[item.tier] / totalWeight,
            }));
            for (let i = 0; i < minutesElapsed && currentDurability > 0; i++) {
              if (Math.random() < 0.4) {
                let rand = Math.random();
                let cumulative = 0;
                const item =
                  itemProbabilities.find((p) => {
                    cumulative += p.probability;
                    return rand <= cumulative;
                  }) || TAXI_FARES[0];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                currentDurability -= 1;
              }
            }
            let totalValue = 0;
            const itemLines = [];
            TAXI_FARES.forEach((item) => {
              const key = item.name.toLowerCase().replace(/\s+/g, "");
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString(
                    "en-US"
                  )})`
                );
              }
            });
            if (itemLines.length === 0) {
              itemLines.push("No passengers served yet.");
            }
            const boostedValue = totalValue * earningsMultiplier;
            const accessibleItems = TAXI_FARES.map(
              (item) =>
                `${item.emoji} ${item.name} ($${item.value.toLocaleString(
                  "en-US"
                )})`
            );
            const durabilityText =
              currentDurability <= 0
                ? `Broken (0/100 durability, earnings paused)`
                : `${Math.floor(currentDurability)}/100 durability`;
            const infoLines = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
              `Driving for ${minutesElapsed} minute(s).`,
              `Taxi Level: ${taxiLevel} (x${earningsMultiplier.toFixed(
                1
              )} earnings)`,
              `Taxi: ${taxi.name} (${taxi.emoji}, ${durabilityText})`,
              `Passenger Types: ${accessibleItems.join(", ")}`,
              `Passengers Served:`,
              ...itemLines,
              `Total Pending Value: $${boostedValue.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "c"],
          description:
            "Collect your pending balance and reset earnings for continued taxi service.",
          usage: "taxi collect",
          async deploy({ chat, event, hoshinoDB }) {
            console.log("Taxi collect args:", ctx.args); 
            const userID = cleanUserID(event.senderID);
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const {
              balance = 0,
              taxiStartTime = null,
              taxiItems = {
                shortRide: 0,
                localTrip: 0,
                cityTour: 0,
                airportRun: 0,
                downtownFare: 0,
                nightShift: 0,
                vipClient: 0,
                longDistanceTrip: 0,
              },
              taxiLevel = 0,
              taxiDurability = 100,
              taxiType = null,
              taxiMultiplierBoost = 0,
            } = userData;
            if (!taxiType) {
              return await chat.reply(
                "You need to buy a taxi first! Use: taxi buy"
              );
            }
            if (!taxiStartTime) {
              return await chat.reply(
                "You are not driving a taxi. Start with: taxi start"
              );
            }
            const taxi = TAXI_TIERS[taxiType];
            const minutesElapsed = Math.floor(
              (Date.now() - taxiStartTime) / 60000
            );
            const itemsCollected = { ...taxiItems };
            let currentDurability = taxiDurability;
            const earningsMultiplier = 1 + taxiLevel * 0.3 + taxiMultiplierBoost;
            const tierWeights = {
              common: 0.6,
              uncommon: 0.3,
              rare: 0.1,
            };
            const totalWeight = Object.values(tierWeights).reduce(
              (sum, weight) => sum + weight,
              0
            );
            const itemProbabilities = TAXI_FARES.map((item) => ({
              ...item,
              probability: tierWeights[item.tier] / totalWeight,
            }));
            for (let i = 0; i < minutesElapsed && currentDurability > 0; i++) {
              if (Math.random() < 0.4) {
                let rand = Math.random();
                let cumulative = 0;
                const item =
                  itemProbabilities.find((p) => {
                    cumulative += p.probability;
                    return rand <= cumulative;
                  }) || TAXI_FARES[0];
                const key = item.name.toLowerCase().replace(/\s+/g, "");
                itemsCollected[key] = (itemsCollected[key] || 0) + 1;
                currentDurability -= 1;
              }
            }
            let totalValue = 0;
            const itemLines = [];
            TAXI_FARES.forEach((item) => {
              const key = item.name.toLowerCase().replace(/\s+/g, "");
              const count = itemsCollected[key] || 0;
              const itemValue = count * item.value;
              totalValue += itemValue;
              if (count > 0) {
                itemLines.push(
                  `${item.emoji} ${item.name}: ${count} ($${itemValue.toLocaleString(
                    "en-US"
                  )})`
                );
              }
            });
            const boostedValue = totalValue * earningsMultiplier;
            const infoLines = [];
            if (totalValue > 0) {
              infoLines.push(
                `Collected $${boostedValue.toLocaleString(
                  "en-US"
                )} from taxi service!`
              );
              infoLines.push("Passengers served:");
              infoLines.push(...itemLines);
            } else {
              infoLines.push("No balance was earned from taxi service.");
            }
            if (currentDurability <= 0) {
              infoLines.push(
                `Your ${taxi.name} is broken (0/100 durability)! Earnings paused until repaired.`
              );
            } else {
              infoLines.push("Taxi service continues for the next earnings!");
            }
            await hoshinoDB.set(userID, {
              ...userData,
              balance: balance + boostedValue,
              taxiStartTime: Date.now(),
              taxiItems: {
                shortRide: 0,
                localTrip: 0,
                cityTour: 0,
                airportRun: 0,
                downtownFare: 0,
                nightShift: 0,
                vipClient: 0,
                longDistanceTrip: 0,
              },
              taxiDurability: currentDurability,
            });
            await chat.reply(infoLines.join("\n"));
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
