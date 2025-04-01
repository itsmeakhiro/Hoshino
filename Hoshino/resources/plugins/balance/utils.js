const WEALTH_RANKS = [
    { amount: 0, rank: "Low Income" },
    { amount: 10_000, rank: "Middle Class" },
    { amount: 100_000, rank: "Upper Middle Class" },
    { amount: 500_000, rank: "Mass Affluent" },
    { amount: 1_000_000, rank: "Millionaire" },
    { amount: 5_000_000, rank: "Multi-Millionaire" },
    { amount: 10_000_000, rank: "High Net Worth Individual (HNWI)" },
    { amount: 50_000_000, rank: "Ultra High Net Worth Individual (UHNWI)" },
    { amount: 100_000_000, rank: "Centimillionaire" },
    { amount: 500_000_000, rank: "Demi-Billionaire" },
    { amount: 1_000_000_000, rank: "Billionaire" },
    { amount: 5_000_000_000, rank: "Multi-Billionaire" },
    { amount: 10_000_000_000, rank: "Tycoon" },
    { amount: 50_000_000_000, rank: "Industrial Magnate" },
    { amount: 100_000_000_000, rank: "Trillionaire" },
    { amount: 500_000_000_000, rank: "Multi-Trillionaire" },
    { amount: 1_000_000_000_000, rank: "Financial Emperor" },
    { amount: 5_000_000_000_000, rank: "Supreme Wealth Authority" },
    { amount: 10_000_000_000_000, rank: "Global Economic Minister" },
    { amount: 50_000_000_000_000, rank: "Minister of Finance" },
    { amount: 100_000_000_000_000, rank: "High Council of Wealth" },
    { amount: 1_000_000_000_000_000, rank: "Royal Minister of Treasury" },
  ];
  
  class BalanceHandler {
    static WEALTH_RANKS = WEALTH_RANKS;
    constructor(data) {
      this.data = data ?? {};
      this.data.balance =
        typeof this.data.balance === "number" ? this.data.balance : 0;
    }
  
    getBalance() {
      return this.data.balance;
    }
  
    addBalance(amount) {
      if (typeof amount !== "number" || amount <= 0)
        throw new Error("Invalid amount.");
      this.data.balance += amount;
    }
  
    deductBalance(amount) {
      if (typeof amount !== "number" || amount <= 0)
        throw new Error("Invalid amount.");
      if (this.data.balance < amount) throw new Error("Insufficient balance.");
      this.data.balance -= amount;
    }
  
    getWealthRank() {
      let rank = WEALTH_RANKS.findLast((r) => this.data.balance >= r.amount);
      return rank ? rank.rank : WEALTH_RANKS[0]?.rank;
    }
  
    export() {
      return { balance: this.data.balance };
    }
  
    raw() {
      return this.export().balance;
    }
  }
  
  module.exports = BalanceHandler;