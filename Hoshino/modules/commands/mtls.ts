const manifest: HoshinoLia.CommandManifest = {
  name: "mtls",
  aliases: ["mtlslite"],
  description: "Minting Token and Lending Service. (Rework 3.6.0)",
  author: "Liane Cagara",
  version: "4.2.0",
  category: "Finance",
  cooldown: 5,
  developer: "Liane Cagara",
  config: {
    admin: false,
    moderator: false,
  },
};

const style: HoshinoLia.Command["style"] = {
  title: `〘 🪙 〙MTLS LITE`,
  footer: "Made with 🤍 by **Liane Cagara**",
  type: "lines1",
};

const font: HoshinoLia.Command["font"] = {
  title: "bold",
  content: "sans",
  footer: "sans",
};

export function formatCash(
  number: number,
  emoji?: string,
  bold?: boolean
): string;

export function formatCash(number: number, bold?: boolean): string;

export function formatCash(
  number: number = 0,
  emoji: string | boolean = "💵",
  bold = false
) {
  if (typeof emoji === "boolean") {
    bold = emoji;
    emoji = "💵";
  }
  return `${bold ? "**" : ""}$${Number(number).toLocaleString()}${
    emoji || "💵"
  }${bold ? "**" : ""}`;
}

export async function deploy(ctx: HoshinoLia.EntryObj) {
  const home = new ctx.HoshinoHM([
    {
      subcommand: "lend",
      description: "Lend money and retrieve it later with potential interest.",
      usage: "lend <amount>",
      aliases: ["-le"],
      async deploy({ hoshinoDB, event, chat, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const amount = parseInt(args[1]);

        if (isInvalidAm(amount, userData.balance)) {
          return chat.reply(
            `📋 | The amount (first argument) must be a **valid numerical**, not lower than **1**, and **not higher** than your **balance.** (${formatCash(
              userData.balance,
              true
            )})`
          );
        }

        const newLend = amount;
        const newBal = Number(userData.balance - newLend);

        const lendAmount = Number(userData.lendAmount ?? 0);

        if (isNaN(lendAmount) || isNaN(newLend) || isNaN(newBal)) {
          console.log({
            lendAmount,
            newBal,
            newLend,
          });
          return chat.reply("err.");
        }

        if (lendAmount > 0 && userData.lendTimestamp) {
          return chat.reply(
            `📋 | You cannot lend right now. You already have a **valid lend** of ${formatCash(
              lendAmount,
              true
            )}, please **retrieve** it first!`
          );
        }

        await hoshinoDB.set(event.senderID, {
          lendAmount: newLend,
          balance: newBal,
          lendTimestamp: Date.now(),
        });

        return chat.reply(
          `💌 | Successfully lent ${formatCash(
            amount,
            true
          )}\n\nYour new **balance** is: ${formatCash(newBal, true)}`
        );
      },
    },
    {
      subcommand: "retrieve",
      description: "Retrieve lent amount and view earned interest.",
      aliases: ["-re"],
      usage: "retrieve [force]",
      async deploy({ hoshinoDB, event, chat, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const otherMoney = userData * 10;
        const isForce = args[0]?.toLowerCase() === "force";

        const lendAmount = Number(userData.lendAmount ?? 0);

        if (!userData.lendTimestamp) {
          return chat.reply("❕ | No **active** lend to retrieve.");
        }

        const now = Date.now();

        const durationInSeconds = Math.max(
          (now - userData.lendTimestamp) / 1000 - 60 * 60 * 1000,
          0
        );
        const inflationRate = 0;

        const interestNoInflation =
          lendAmount * (0.001 / 365) * durationInSeconds;

        const interest = Math.floor(
          Math.max(
            0,
            interestNoInflation - interestNoInflation * (inflationRate / 1000)
          )
        );

        const cap = Math.floor(otherMoney * 0.5);

        const interestCapped = Math.min(interest, cap);
        const totalAmount = Math.floor(lendAmount + interestCapped);

        const newBal = Number(userData.balance + totalAmount);

        if (isNaN(lendAmount) || isNaN(newBal) || isNaN(totalAmount)) {
          console.log({
            lendAmount,
            newBal,
            totalAmount,
            interestCapped,
            inflationRate,
            interestNoInflation,
            otherMoney,
            cap,
            interest,
            bal: userData.balance,
          });
          return chat.reply("err.");
        }

        if (interestCapped < 1 && !isForce) {
          return chat.reply(
            `📋 | You **cannot retrieve** this lent amount because the **capped interest** is too **LOW** (${formatCash(
              interestCapped,
              true
            )}). You would **not earn** anything. Please wait or add a **force** argument.`
          );
        }

        await hoshinoDB.set(event.senderID, {
          balance: newBal,
          lendTimestamp: null,
          lendAmount: 0,
        });

        return chat.reply(
          `🎉 | Successfully retrieved ${formatCash(
            totalAmount,
            true
          )}$. (***GAIN*** = ${formatCash(
            interestCapped,
            true
          )})\n\nYour new balance is: ${formatCash(newBal, true)}`
        );
      },
    },
    {
      subcommand: "send",
      description: "Transfer money to another user at no cost.",
      usage: "send <name|uid> <amount>",
      aliases: ["-tr", "-se", "transfer"],
      async deploy({ hoshinoDB, event, chat, Inventory, args }) {
        const userData = await hoshinoDB.get(event.senderID);
        const targTest = args[1];
        const inventory = new Inventory(userData.inventory);

        let recipient;

        if (
          (await hoshinoDB.mongo.containsKey(targTest)) &&
          targTest !== "undefined"
        ) {
          recipient = await hoshinoDB.getCache(targTest);
          if (recipient) {
            recipient.userID = targTest;
          }
        }

        if (!recipient && targTest !== "Unregistered") {
          const all = await hoshinoDB.getAll();
          const f = Object.entries(all).find(
            (i) => i[1]?.username === targTest
          );
          if (f) {
            recipient = f[1];
            recipient.userID = f[0];
          }
        }

        if (
          !recipient ||
          (recipient?.username !== targTest && recipient?.userID !== targTest)
        ) {
          return chat.reply(
            `❕ | Recipient **not found**. Ensure you are providing the correct user's **name** or user's **ID** as a first argument.`
          );
        }

        if (recipient.userID === event.senderID) {
          return chat.reply(`❕ | You cannot send money **to yourself**!`);
        }

        const amount = parseInt(args[2]);

        if (isInvalidAm(amount, userData.balance)) {
          return chat.reply(
            `📋 | The amount (second argument) must be a **valid numerical**, not lower than **1**, and **not higher** than your **balance.** (${formatCash(
              userData.balance,
              true
            )})`
          );
        }

        const newBal = Number(userData.balance - amount);
        const reciBal = Number(recipient.balance + amount);

        if (
          reciBal < recipient.balance ||
          isNaN(reciBal) || isNaN(newBal) || isNaN(amount)
        ) {
          console.log({
            reciBal,
            recipientBal: recipient.balance,
            bal: userData.balance,
            newBal,
            amount,
          });
          return chat.reply("err..");
        }

        await hoshinoDB.set(event.senderID, {
          balance: newBal,
        });
        await hoshinoDB.set(recipient.userID, {
          balance: reciBal,
        });

        return chat.reply(
          `💥 | Successfully used **0** 🌑 to send ${formatCash(
            amount,
            true
          )}$ to **${
            recipient.username ?? "Unregistered"
          }**\n\nRemaining **Shadow Coins**: ${formatCash(
            inventory.getAmount("shadowCoin"),
            "🌑",
            true
          )}`
        );
      },
    },
    {
      subcommand: "inspect",
      description: "View financial details of a user by name or ID",
      usage: "inspect <name|uid> <amount>",
      aliases: ["-ins"],
      async deploy({ hoshinoDB, chat, args }) {
        const targTest = args[1];

        let recipient;

        if (
          (await hoshinoDB.mongo.containsKey(targTest)) &&
          targTest !== "undefined"
        ) {
          recipient = await hoshinoDB.getCache(targTest);
          if (recipient) {
            recipient.userID = targTest;
          }
        }

        if (!recipient && targTest !== "Unregistered") {
          const all = await hoshinoDB.getAll();
          const f = Object.entries(all).find(
            (i) => i[1]?.username === targTest
          );
          if (f) {
            recipient = f[1];
            recipient.userID = f[0];
          }
        }

        if (
          !recipient ||
          (recipient?.username !== targTest && recipient?.userID !== targTest)
        ) {
          return chat.reply(
            `❕ | Target **not found**. Ensure you are providing the correct user's **name** or user's **ID** as a first argument.`
          );
        }

        const texts = [
          `👤 | **Name**: ${recipient.username}`,
          `🪙 | **Balance**: ${formatCash(recipient.balance, true)}`,
          `🎲 | **User ID**: ${recipient.userID}`,
          `📤 | **Lent Amount**: ${formatCash(
            recipient.lendAmount ?? 0,
            true
          )}`,
          `⏳ | **Lent Since**: ${
            recipient.lendTimestamp
              ? `${formatTime(Date.now() - recipient.lendTimestamp)}`
              : "No active lend."
          }`,
        ];

        return chat.reply(texts.join("\n"));
      },
    },
  ]);
  return home.runInContext(ctx);
}

export default {
  manifest,
  style,
  deploy,
  font,
} as HoshinoLia.Command;

function isInvalidAm(amount: number, balance: number) {
  return isNaN(amount) || amount < 1 || amount > balance;
}

function formatTime(ms: number) {
  const secs = Math.floor(ms / 1000) % 60;
  const mins = Math.floor(ms / (1000 * 60)) % 60;
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
}