const SLOTS_SYMBOLS = ["🍒", "🍋", "⭐", "💎", "🔔"];
const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0–36
const ROULETTE_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const ROULETTE_BLACK = ROULETTE_NUMBERS.filter(n => n !== 0 && !ROULETTE_RED.includes(n));

const getCardValue = () => Math.floor(Math.random() * 13) + 1; // 1–13 (Ace–King)
const calculateHand = (cards) => {
  let sum = 0, aces = 0;
  for (const card of cards) {
    if (card === 1) {
      aces++;
      sum += 11;
    } else if (card >= 11) {
      sum += 10;
    } else {
      sum += card;
    }
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
};

const command: HoshinoLia.Command = {
  manifest: {
    name: "casino",
    aliases: ["csn"],
    version: "1.0.2",
    developer: "Francis Loyd Raval",
    description:
      "Play gambling games like Slots, Blackjack, Coin Flip, and Roulette to win or lose balance money. Wager responsibly with bets between $10 and $1000.",
    category: "Gambling",
    usage:
      "casino slots <bet> | casino blackjack <bet> | casino coinflip <bet> [heads|tails] | casino roulette <bet> [red|black|<number>] | casino balance | casino rules",
    config: {
      admin: false,
      moderator: false,
    },
  },
  style: {
    type: "lines1",
    title: "〘 🎰 〙 CASINO",
    footer: "Made with 👼 by **Francis Loyd Raval**.",
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
          subcommand: "slots",
          aliases: ["slot"],
          description: "Play Slots with a bet ($10–$1000). Match symbols to win!",
          usage: "casino slots <bet>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const bet = parseInt(args[0]);
            if (isNaN(bet) || bet < 10 || bet > 1000) {
              return await chat.reply(
                "Invalid bet! Use a number between $10 and $1000."
              );
            }
            if (userData.balance < bet) {
              return await chat.reply(
                `Insufficient balance! You have $${userData.balance.toLocaleString(
                  "en-US"
                )}, need $${bet.toLocaleString("en-US")}.`
              );
            }
            const reels = [
              SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)],
              SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)],
              SLOTS_SYMBOLS[Math.floor(Math.random() * SLOTS_SYMBOLS.length)],
            ];
            let payout = 0;
            if (reels[0] === reels[1] && reels[1] === reels[2]) {
              payout = bet * 5; 
            } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
              payout = bet * 2; 
            }
            const newBalance = userData.balance - bet + payout;
            await hoshinoDB.set(userID, { ...userData, balance: newBalance });
            const infoLines: string[] = [
              `Spun the slots: ${reels.join(" ")}`,
              payout > 0
                ? `You won $${payout.toLocaleString("en-US")}!`
                : "No matches, you lost your bet.",
              `New Balance: $${newBalance.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "blackjack",
          aliases: ["bj"],
          description: "Play Blackjack with a bet ($10–$1000). Beat the dealer to win!",
          usage: "casino blackjack <bet>",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const bet = parseInt(args[0]);
            if (isNaN(bet) || bet < 10 || bet > 1000) {
              return await chat.reply(
                "Invalid bet! Use a number between $10 and $1000."
              );
            }
            if (userData.balance < bet) {
              return await chat.reply(
                `Insufficient balance! You have $${userData.balance.toLocaleString(
                  "en-US"
                )}, need $${bet.toLocaleString("en-US")}.`
              );
            }
            const playerCards = [getCardValue(), getCardValue()];
            const dealerCards = [getCardValue(), getCardValue()];
            let playerScore = calculateHand(playerCards);
            let dealerScore = calculateHand(dealerCards);
            while (dealerScore < 17 && dealerScore <= 21) {
              dealerCards.push(getCardValue());
              dealerScore = calculateHand(dealerCards);
            }
            let payout = 0;
            let result = "";
            if (playerScore === 21 && playerCards.length === 2) {
              payout = bet * 2.5; 
              result = "Blackjack! You win!";
            } else if (playerScore > 21) {
              result = "Bust! You lose.";
            } else if (dealerScore > 21) {
              payout = bet * 2;
              result = "Dealer busts! You win!";
            } else if (playerScore > dealerScore) {
              payout = bet * 2;
              result = "You win!";
            } else if (playerScore === dealerScore) {
              payout = bet;
              result = "Push! Bet returned.";
            } else {
              result = "Dealer wins! You lose.";
            }
            const newBalance = userData.balance - bet + payout;
            await hoshinoDB.set(userID, { ...userData, balance: newBalance });
            const infoLines: string[] = [
              `Your cards: ${playerCards.join(", ")} (Score: ${playerScore})`,
              `Dealer's cards: ${dealerCards.join(", ")} (Score: ${dealerScore})`,
              result,
              `New Balance: $${newBalance.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "coinflip",
          aliases: ["cf"],
          description: "Play Coin Flip with a bet ($10–$1000). Guess heads or tails!",
          usage: "casino coinflip <bet> [heads|tails]",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const bet = parseInt(args[0]);
            const choice = args[1]?.toLowerCase();
            if (isNaN(bet) || bet < 10 || bet > 1000) {
              return await chat.reply(
                "Invalid bet! Use a number between $10 and $1000."
              );
            }
            if (!["heads", "tails"].includes(choice)) {
              return await chat.reply(
                "Invalid choice! Use 'heads' or 'tails'."
              );
            }
            if (userData.balance < bet) {
              return await chat.reply(
                `Insufficient balance! You have $${userData.balance.toLocaleString(
                  "en-US"
                )}, need $${bet.toLocaleString("en-US")}.`
              );
            }
            const result = Math.random() < 0.5 ? "heads" : "tails";
            const payout = choice === result ? bet * 2 : 0;
            const newBalance = userData.balance - bet + payout;
            await hoshinoDB.set(userID, { ...userData, balance: newBalance });
            const infoLines: string[] = [
              `Coin flipped: ${result.toUpperCase()}`,
              payout > 0
                ? `You won $${payout.toLocaleString("en-US")}!`
                : "You lost your bet.",
              `New Balance: $${newBalance.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "roulette",
          aliases: ["roul"],
          description: "Play Roulette with a bet ($10–$1000). Bet on red, black, or a number!",
          usage: "casino roulette <bet> [red|black|<number>]",
          async deploy({ chat, event, hoshinoDB, args }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const bet = parseInt(args[0]);
            const choice = args[1]?.toLowerCase();
            const numberBet = parseInt(choice);
            if (isNaN(bet) || bet < 10 || bet > 1000) {
              return await chat.reply(
                "Invalid bet! Use a number between $10 and $1000."
              );
            }
            if (
              !["red", "black"].includes(choice) &&
              (isNaN(numberBet) || numberBet < 0 || numberBet > 36)
            ) {
              return await chat.reply(
                "Invalid choice! Use 'red', 'black', or a number between 0 and 36."
              );
            }
            if (userData.balance < bet) {
              return await chat.reply(
                `Insufficient balance! You have $${userData.balance.toLocaleString(
                  "en-US"
                )}, need $${bet.toLocaleString("en-US")}.`
              );
            }
            const result = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
            let payout = 0;
            let outcome = `Ball landed on ${result} (${ROULETTE_RED.includes(result) ? "Red" : result === 0 ? "Green" : "Black"})`;
            if (choice === "red" && ROULETTE_RED.includes(result)) {
              payout = bet * 2;
            } else if (choice === "black" && ROULETTE_BLACK.includes(result)) {
              payout = bet * 2;
            } else if (!isNaN(numberBet) && numberBet === result) {
              payout = bet * 36;
            }
            const newBalance = userData.balance - bet + payout;
            await hoshinoDB.set(userID, { ...userData, balance: newBalance });
            const infoLines: string[] = [
              outcome,
              payout > 0
                ? `You won $${payout.toLocaleString("en-US")}!`
                : "You lost your bet.",
              `New Balance: $${newBalance.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "balance",
          aliases: ["bal"],
          description: "Check your current balance and user info.",
          usage: "casino balance",
          async deploy({ chat, event, hoshinoDB }) {
            const userID = event.senderID;
            const userData = await hoshinoDB.get(userID);
            if (!userData || !userData.username) {
              return await chat.reply(
                "You need to register first! Use: profile register <username>"
              );
            }
            const { balance = 0, username, gameid = "N/A" } = userData;
            const infoLines: string[] = [
              `Username: ${username}`,
              `Game ID: ${gameid}`,
              `Balance: $${balance.toLocaleString("en-US")}`,
            ];
            await chat.reply(infoLines.join("\n"));
          },
        },
        {
          subcommand: "rules",
          aliases: ["help"],
          description: "View rules and payouts for all casino games.",
          usage: "casino rules",
          async deploy({ chat }) {
            const infoLines: string[] = [
              "🎰 **Casino Games Rules**",
              "",
              "**Slots**",
              "- Bet $10–$1000 to spin three reels.",
              "- Payouts: 3 matching symbols = 5x bet, 2 matching = 2x bet, no matches = lose bet.",
              "- Example: casino slots 50",
              "",
              "**Blackjack**",
              "- Bet $10–$1000 to play against the dealer.",
              "- Goal: Get closer to 21 without going over.",
              "- Payouts: Win = 2x bet, Blackjack (Ace + 10) = 2.5x bet, Push = bet returned, Loss = lose bet.",
              "- Dealer stands at 17 or higher.",
              "- Example: casino blackjack 100",
              "",
              "**Coin Flip**",
              "- Bet $10–$1000 on heads or tails (50% chance).",
              "- Payout: Correct guess = 2x bet, wrong = lose bet.",
              "- Example: casino coinflip 20 heads",
              "",
              "**Roulette**",
              "- Bet $10–$1000 on red, black, or a number (0–36).",
              "- Payouts: Red/Black = 2x bet, Number = 36x bet, wrong = lose bet.",
              "- Example: casino roulette 50 red, casino roulette 50 17",
              "",
              "Use 'casino balance' to check your funds. Bet responsibly!",
            ];
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
