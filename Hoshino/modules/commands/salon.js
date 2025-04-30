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
      "Run a salon simulator to earn money by buying a shop, starting operations, recruiting a designer, upgrading shop or designer, checking status, and collecting earnings.",
    category: "Economy",
    usage: "salon buy | salon start | salon recruit | salon upgrade | salon status | salon collect",
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
        upgradeBaseCost: 200000,
        maxLevel: 5,
      },
      deluxe: {
        name: "Deluxe Salon",
        description: "A premium salon offering advanced styling services.",
        cost: 25000,
        baseEarnings: 200,
        maxEarnings: 600,
        emoji: "💇‍♀️",
        upgradeBaseCost: 400000,
        maxLevel: 5,
      },
      luxury: {
        name: "Luxury Salon",
        description: "An elite salon for high-end beauty treatments.",
        cost: 100000,
        baseEarnings: 400,
        maxEarnings: 1200,
        emoji: "✨",
        upgradeBaseCost: 800000,
        maxLevel: 5,
      },
    };

    const designer = {
      name: "Star Designer",
      description: "Boosts salon earnings with a salary tax based on level.",
      cost: 10000,
      upgradeBaseCost: 20000,
      maxLevel: 5,
      levels: [
        { multiplier: 2.0, salaryTax: 0.2 },
        { multiplier: 2.5, salaryTax: 0.25 },
        { multiplier: 3.0, salaryTax: 0.3 },
        { multiplier: 3.5, salaryTax: 0.35 },
        { multiplier: 4.0, salaryTax: 0.4 },
      ],
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
                shopLevel: 1,
                active: false,
                startTime: 0,
                earned: 0,
                lastCollectionTime: 0,
                designer: false,
                designerLevel: 0,
              },
            });
            await chat.reply(
              `Successfully purchased a ${shops[shopType].name} for $${cost.toLocaleString(
                "en-US"
              )}! Use 'salon start' to begin earning.`
            );
          },
        },
        {
          subcommand: "start",
          aliases: ["begin", "open"],
          description: "Start salon operations to earn money over time.",
          usage: "salon start",
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
            if (userData.salon.active && userData.salon.startTime) {
              const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
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
                  "Salon session is invalid. Starting a new session."
                );
              }
              const shop = shops[userData.salon.shop];
              const shopLevel = userData.salon.shopLevel || 1;
              const collectionEvents = Math.floor(timeElapsed / 5) || 1;
              let totalEarned = 0;
              for (let i = 0; i < collectionEvents; i++) {
                const earnings =
                  Math.floor(
                    Math.random() * (shop.maxEarnings - shop.baseEarnings + 1)
                  ) + shop.baseEarnings;
                totalEarned += earnings * (1 + 0.2 * (shopLevel - 1));
              }
              const designerLevel = userData.salon.designerLevel || 0;
              const designerMultiplier = userData.salon.designer
                ? designer.levels[designerLevel].multiplier
                : 1;
              totalEarned *= designerMultiplier;
              const taxAmount = userData.salon.designer
                ? Math.floor(totalEarned * designer.levels[designerLevel].salaryTax)
                : 0;
              const netEarnings = totalEarned - taxAmount;
              const newBalance = (userData.balance || 0) + netEarnings;
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: newBalance,
                salon: {
                  ...userData.salon,
                  active: false,
                  startTime: 0,
                  earned: 0,
                  lastCollectionTime: Date.now(),
                },
              });
              const timeDisplay =
                timeElapsed < 1
                  ? `${Math.floor(timeElapsed * 60)} seconds`
                  : `${Math.floor(timeElapsed)} minutes`;
              const message =
                `Previous salon session ran for ${timeDisplay}:\n` +
                `Gross Earnings: $${totalEarned.toLocaleString("en-US")}\n` +
                (taxAmount > 0
                  ? `Designer Salary Tax: $${taxAmount.toLocaleString("en-US")}\n`
                  : "") +
                `Net Earnings: $${netEarnings.toLocaleString("en-US")}\n` +
                `New Balance: $${newBalance.toLocaleString("en-US")}\n\n`;
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
              await chat.reply(
                message +
                  `New salon session started at your ${shop.name} ${
                    shop.emoji
                  }! Use 'salon collect' to collect earnings.`
              );
            } else {
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
              await chat.reply(
                `Salon operations started at your ${shops[userData.salon.shop].name} ${
                  shops[userData.salon.shop].emoji
                }! Use 'salon collect' to collect earnings.`
              );
            }
          },
        },
        {
          subcommand: "recruit",
          aliases: ["hire", "designer"],
          description: "Recruit a designer to boost your salon's earnings.",
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
                `You already have a ${designer.name}! Use 'salon upgrade designer' to improve their skills.`
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
                designerLevel: 0,
              },
            });
            await chat.reply(
              `Successfully recruited a ${designer.name} ${designer.emoji} for $${cost.toLocaleString(
                "en-US"
              )}! Your salon earnings are now boosted by ${designer.levels[0].multiplier}x, with a ${(
                designer.levels[0].salaryTax * 100
              ).toFixed(0)}% salary tax.`
            );
          },
        },
        {
          subcommand: "upgrade",
          aliases: ["enhance", "improve"],
          description: "Upgrade your salon shop or designer to increase earnings.",
          usage: "salon upgrade <shop | designer>",
          async deploy({ chat, args, event, hoshinoDB }) {
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
            let upgradeType = args[0]?.toLowerCase().trim() || "";
            if (upgradeType === "upgrade" && args.length > 1) {
              upgradeType = args[1].toLowerCase().trim();
            }
            if (!upgradeType) {
              const shop = shops[userData.salon.shop];
              const shopLevel = userData.salon.shopLevel || 1;
              const designerLevel = userData.salon.designerLevel || 0;
              const shopUpgradeCost = shop.upgradeBaseCost * Math.pow(2, shopLevel - 1);
              const designerUpgradeCost = userData.salon.designer
                ? designer.upgradeBaseCost * Math.pow(2, designerLevel)
                : 0;
              return await chat.reply(
                `No upgrade specified. Usage: salon upgrade <shop | designer>\n` +
                `Available upgrades for your ${shop.name} ${shop.emoji}:\n\n` +
                `Shop (Level ${shopLevel}/${shop.maxLevel})\n` +
                `Description: Increases earnings by 20% per level.\n` +
                `Next Upgrade Cost: ${
                  shopLevel < shop.maxLevel
                    ? `$${shopUpgradeCost.toLocaleString("en-US")}`
                    : "Max level reached"
                }\n\n` +
                `Designer (Level ${designerLevel}/${designer.maxLevel})\n` +
                `Description: Increases earnings multiplier to ${
                  userData.salon.designer ? designer.levels[designerLevel].multiplier : 2.0
                }x with a ${
                  userData.salon.designer ? designer.levels[designerLevel].salaryTax * 100 : 20
                }% tax.\n` +
                `Next Upgrade Cost: ${
                  userData.salon.designer && designerLevel < designer.maxLevel
                    ? `$${designerUpgradeCost.toLocaleString("en-US")}`
                    : userData.salon.designer
                    ? "Max level reached"
                    : "Recruit a designer first"
                }`
              );
            }
            if (!["shop", "designer"].includes(upgradeType)) {
              return await chat.reply(
                `Invalid upgrade: ${args[0] || upgradeType}. Use: salon upgrade <shop | designer>`
              );
            }
            const shop = shops[userData.salon.shop];
            const shopLevel = userData.salon.shopLevel || 1;
            const designerLevel = userData.salon.designerLevel || 0;
            if (upgradeType === "shop") {
              if (shopLevel >= shop.maxLevel) {
                return await chat.reply(
                  `Your ${shop.name} is already at the maximum level (${shop.maxLevel})!`
                );
              }
              const upgradeCost = shop.upgradeBaseCost * Math.pow(2, shopLevel - 1);
              const currentBalance = userData.balance || 0;
              if (currentBalance < upgradeCost) {
                return await chat.reply(
                  `You need $${upgradeCost.toLocaleString(
                    "en-US"
                  )} to upgrade your ${shop.name}, but you only have $${currentBalance.toLocaleString(
                    "en-US"
                  )}!`
                );
              }
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: currentBalance - upgradeCost,
                salon: {
                  ...userData.salon,
                  shopLevel: shopLevel + 1,
                },
              });
              await chat.reply(
                `Successfully upgraded your ${shop.name} to Level ${
                  shopLevel + 1
                } for $${upgradeCost.toLocaleString(
                  "en-US"
                )}! Earnings increased by ${(0.2 * 100).toFixed(0)}%.`
              );
            } else if (upgradeType === "designer") {
              if (!userData.salon.designer) {
                return await chat.reply(
                  `You need to recruit a ${designer.name} first! Use: salon recruit`
                );
              }
              if (designerLevel >= designer.maxLevel) {
                return await chat.reply(
                  `Your ${designer.name} is already at the maximum level (${designer.maxLevel})!`
                );
              }
              const upgradeCost = designer.upgradeBaseCost * Math.pow(2, designerLevel);
              const currentBalance = userData.balance || 0;
              if (currentBalance < upgradeCost) {
                return await chat.reply(
                  `You need $${upgradeCost.toLocaleString(
                    "en-US"
                  )} to upgrade your ${designer.name}, but you only have $${currentBalance.toLocaleString(
                    "en-US"
                  )}!`
                );
              }
              await hoshinoDB.set(event.senderID, {
                ...userData,
                balance: currentBalance - upgradeCost,
                salon: {
                  ...userData.salon,
                  designerLevel: designerLevel + 1,
                },
              });
              const newLevel = designerLevel + 1;
              await chat.reply(
                `Successfully upgraded your ${designer.name} to Level ${newLevel} for $${upgradeCost.toLocaleString(
                  "en-US"
                )}! Earnings multiplier increased to ${
                  designer.levels[newLevel].multiplier
                }x with a ${(designer.levels[newLevel].salaryTax * 100).toFixed(
                  0
                )}% salary tax.`
              );
            }
          },
        },
        {
          subcommand: "status",
          aliases: ["info", "progress"],
          description: "Check your salon's progress, shop level, designer status, and estimated earnings.",
          usage: "salon status",
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
            const shop = shops[userData.salon.shop];
            const shopLevel = userData.salon.shopLevel || 1;
            const designerLevel = userData.salon.designerLevel || 0;
            let message = `Salon: ${shop.name} ${shop.emoji} (Level ${shopLevel}/${shop.maxLevel})\n` +
                          `Earnings Multiplier: ${(1 + 0.2 * (shopLevel - 1)).toFixed(2)}x\n` +
                          `Designer: ${userData.salon.designer ? `${designer.name} (Level ${designerLevel}/${designer.maxLevel})` : "None"}\n` +
                          (userData.salon.designer
                            ? `Designer Multiplier: ${designer.levels[designerLevel].multiplier}x\n` +
                              `Designer Salary Tax: ${(designer.levels[designerLevel].salaryTax * 100).toFixed(0)}%`
                            : "Use 'salon recruit' to hire a designer.") + "\n";
            if (!userData.salon.active || !userData.salon.startTime) {
              message += "Status: Not currently operating. Use 'salon start' to begin.";
              return await chat.reply(message);
            }
            const timeElapsed = (Date.now() - userData.salon.startTime) / 1000 / 60;
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
                "Salon session is invalid. Please start a new session with 'salon start'."
              );
            }
            const collectionEvents = Math.floor(timeElapsed / 5) || 1;
            let totalEarned = 0;
            for (let i = 0; i < collectionEvents; i++) {
              const earnings =
                Math.floor(
                  Math.random() * (shop.maxEarnings - shop.baseEarnings + 1)
                ) + shop.baseEarnings;
              totalEarned += earnings * (1 + 0.2 * (shopLevel - 1));
            }
            const designerMultiplier = userData.salon.designer
              ? designer.levels[designerLevel].multiplier
              : 1;
            totalEarned *= designerMultiplier;
            const taxAmount = userData.salon.designer
              ? Math.floor(totalEarned * designer.levels[designerLevel].salaryTax)
              : 0;
            const netEarnings = totalEarned - taxAmount;
            const timeDisplay =
              timeElapsed < 1
                ? `${Math.floor(timeElapsed * 60)} seconds`
                : `${Math.floor(timeElapsed)} minutes`;
            message += `Status: Operating for ${timeDisplay}\n` +
                      `Estimated Earnings:\n` +
                      `Gross: $${totalEarned.toLocaleString("en-US")}\n` +
                      (taxAmount > 0
                        ? `Designer Salary Tax: $${taxAmount.toLocaleString("en-US")}\n`
                        : "") +
                      `Net: $${netEarnings.toLocaleString("en-US")}\n` +
                      `Use 'salon collect' to claim these earnings.`;
            await chat.reply(message);
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
              return await chat.reply(
                "You haven't started salon operations! Use 'salon start' to begin."
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
                "Salon session is invalid. Please restart with 'salon start'."
              );
            }
            const shop = shops[userData.salon.shop];
            const shopLevel = userData.salon.shopLevel || 1;
            const collectionEvents = Math.floor(timeElapsed / 5) || 1;
            let totalEarned = 0;
            for (let i = 0; i < collectionEvents; i++) {
              const earnings =
                Math.floor(
                  Math.random() * (shop.maxEarnings - shop.baseEarnings + 1)
                ) + shop.baseEarnings;
              totalEarned += earnings * (1 + 0.2 * (shopLevel - 1));
            }
            const designerLevel = userData.salon.designerLevel || 0;
            const designerMultiplier = userData.salon.designer
              ? designer.levels[designerLevel].multiplier
              : 1;
            totalEarned *= designerMultiplier;
            const taxAmount = userData.salon.designer
              ? Math.floor(totalEarned * designer.levels[designerLevel].salaryTax)
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
