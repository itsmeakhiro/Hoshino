/**
 *  @type {HoshinoLia.Command} 
 */
const command = {
  manifest: {
    name: "salon",
    aliases: ["hairshop", "beauty"],
    version: "1.0",
    developer: "Francis Loyd Raval",
    description:
      "Run a salon simulator to earn money by buying a shop, recruiting a designer, and collecting earnings.",
    category: "Economy",
    usage: "salon buy | salon recruit | salon collect",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 💇‍♀️ 〙 SALON",
    footer: "**Developed by**: Francis Loyd Raval",
  },
  font: {
    title: "bold",
    content: "sans",
    footer: "sans",
  },
  async deploy(ctx) {
    const shops = {
      basic: {
        name: "Basic Salon",
        description: "A small salon for basic haircuts and styling.",
        cost: 5000,
        baseEarnings: 100,
        maxEarnings: 300,
        emoji: "💈",
      },
      deluxe: {
        name: "Deluxe Salon",
        description: "A premium salon offering advanced styling services.",
        cost: 25000,
        baseEarnings: 200,
        maxEarnings: 600,
        emoji: "💇‍♀️",
      },
      luxury: {
        name: "Luxury Salon",
        description: "An elite salon for high-end beauty treatments.",
        cost: 100000,
        baseEarnings: 400,
        maxEarnings: 1200,
        emoji: "✨",
      },
    };

    const designer = {
      name: "Star Designer",
      description: "Doubles salon earnings but requires a salary (20% tax on earnings).",
      cost: 10000,
      salaryTax: 0.2,
      emoji: "👩‍🎨",
    };

    const home = new ctx.HoshinoHM(
      [
        {
          subcommand: "buy",
          aliases: ["purchase", "shop"],
          description: "Buy a salon shop to start earning money.",
          usage: "salon buy <basic | deluxe | luxury>",
          async deploy({ chat, args, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            let shopType = args[0]?.toLowerCase().trim() || "";
            if (shopType === "buy" && args.length > 1) {
              shopType = args[1].toLowerCase().trim();
            }
            if (!shopType) {
              return await chat.reply(
                `No shop specified. Usage: salon buy <basic | deluxe | luxury>\n` +
                `Available shops:\n\n` +
                Object.values(shops)
                  .map(
                    (s) =>
                      `${s.name} ${s.emoji}\n` +
                      `Description: ${s.description}\n` +
                      `Cost: $${s.cost.toLocaleString("en-US")}\n` +
                      `Earnings: $${s.baseEarnings} - $${s.maxEarnings} per collection`
                  )
                  .join("\n\n")
              );
            }
            if (!shops[shopType]) {
              return await chat.reply(
                `Invalid shop: ${args[0] || shopType}. Use: salon buy <basic | deluxe | luxury>`
              );
            }
            if (userData.salon?.shop) {
              return await chat.reply(
                `You already own a ${shops[userData.salon.shop].name}!`
              );
            }
            const cost = shops[shopType].cost;
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to buy a ${shops[shopType].name}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                shop: shopType,
                active: false,
                startTime: 0,
                earned: 0,
                lastCollectionTime: 0,
                designer: false,
              },
            });
            await chat.reply(
              `Successfully purchased a ${shops[shopType].name} for $${cost.toLocaleString(
                "en-US"
              )}! Use 'salon collect' to start earning.`
            );
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "designer"],
          description: "Recruit a designer to double your salon's earnings.",
          usage: "salon recruit",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon?.shop) {
              return await chat.reply(
                "You need to buy a salon first! Use: salon buy <basic | deluxe | luxury>"
              );
            }
            if (userData.salon.designer) {
              return await chat.reply(
                `You already have a ${designer.name}! Only one designer can be recruited.`
              );
            }
            const cost = designer.cost;
            const currentBalance = userData.balance || 0;
            if (currentBalance < cost) {
              return await chat.reply(
                `You need $${cost.toLocaleString("en-US")} to recruit a ${designer.name}, but you only have $${currentBalance.toLocaleString("en-US")}!`
              );
            }
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: currentBalance - cost,
              salon: {
                ...userData.salon,
                designer: true,
              },
            });
            await chat.reply(
              `Successfully recruited a ${designer.name} ${designer.emoji} for $${cost.toLocaleString(
                "en-US"
              )}! Your salon earnings are now doubled, but a ${(
                designer.salaryTax * 100
              ).toFixed(0)}% salary tax applies.`
            );
          },
        },
        {
          subcommand: "collect",
          aliases: ["claim", "earnings"],
          description: "Collect earnings from your salon, with a tax if a designer is recruited.",
          usage: "salon collect",
          async deploy({ chat, event, hoshinoDB }) {
            const userData = await hoshinoDB.get(event.senderID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            if (!userData.salon?.shop) {
              return await chat.reply(
                "You need to buy a salon first! Use: salon buy <basic | deluxe | luxury>"
              );
            }
            if (!userData.salon.active || !userData.salon.startTime) {
              const startTime = Date.now();
              await hoshinoDB.set(event.senderID, {
                ...userData,
                salon: {
                  ...userData.salon,
                  active: true,
                  startTime,
                  lastCollectionTime: startTime,
                },
              });
              return await chat.reply(
                `Salon operations started at your ${shops[userData.salon.shop].name} ${
                  shops[userData.salon.shop].emoji
                }! Use 'salon collect' again to collect earnings.`
              );
            }
            const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
            if (Date.now() - userData.salon.lastCollectionTime < 60000) {
              return await chat.reply(
                "No earnings yet. Come back after a minute or more to collect."
              );
            }
            if (isNaN(timeElapsed) || timeElapsed < 0) {
              await hoshinoDB.set(event.senderID, {
                ...userData,
                salon: {
                  ...userData.salon,
                  active: false,
                  startTime: 0,
                  earned: 0,
                  lastCollectionTime: 0,
                },
              });
              return await chat.reply(
                "Salon session is invalid. Please restart with 'salon collect'."
              );
            }
            const shop = shops[userData.salon.shop];
            const collectionEvents = Math.floor(timeElapsed / 5) || 1;
            let totalEarned = 0;
            for (let i = 0; i < collectionEvents; i++) {
              const earnings =
                Math.floor(
                  Math.random() * (shop.maxEarnings - shop.baseEarnings + 1)
                ) + shop.baseEarnings;
              totalEarned += earnings;
            }
            if (userData.salon.designer) {
              totalEarned *= 2;
            }
            const taxAmount = userData.salon.designer
              ? Math.floor(totalEarned * designer.salaryTax)
              : 0;
            const netEarnings = totalEarned - taxAmount;
            const newBalance = (userData.balance || 0) + netEarnings;
            const newStartTime = Date.now();
            await hoshinoDB.set(event.senderID, {
              ...userData,
              balance: newBalance,
              salon: {
                ...userData.salon,
                active: true,
                startTime: newStartTime,
                earned: 0,
                lastCollectionTime: newStartTime,
              },
            });
            const timeDisplay =
              timeElapsed < 1
                ? `${Math.floor(timeElapsed * 60)} seconds`
                : `${Math.floor(timeElapsed)} minutes`;
            const replyMessage =
              `Collected earnings from your ${shop.name} ${shop.emoji} for ${timeDisplay}:\n` +
              `Gross Earnings: $${totalEarned.toLocaleString("en-US")}\n` +
              (taxAmount > 0
                ? `Designer Salary Tax: $${taxAmount.toLocaleString("en-US")}\n`
                : "") +
              `Net Earnings: $${netEarnings.toLocaleString("en-US")}\n` +
              `New Balance: $${newBalance.toLocaleString("en-US")}`;
            await chat.reply(replyMessage);
          },
        },
      ],
      "◆"
    );
    await home.runInContext(ctx);
  },
};

export default command;
