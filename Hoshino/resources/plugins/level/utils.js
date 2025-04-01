const RANKS = [
    { level: 1, rank: "New Recruit" },
    { level: 5, rank: "Trainee Hashira" },
    { level: 10, rank: "Mizunoto" },
    { level: 15, rank: "Mizunoe" },
    { level: 20, rank: "Kanoe" },
    { level: 25, rank: "Kanoto" },
    { level: 30, rank: "Tsuchinoto" },
    { level: 35, rank: "Tsuchinoe" },
    { level: 40, rank: "Hinoto" },
    { level: 45, rank: "Hinoe" },
    { level: 50, rank: "Kinoto" },
    { level: 55, rank: "Kinoe" },
    { level: 60, rank: "Junior Slayer" },
    { level: 65, rank: "Elite Slayer" },
    { level: 70, rank: "Demon Slayer Elite" },
    { level: 75, rank: "Pillar (Hashira)" },
    { level: 80, rank: "Legendary Hashira" },
    { level: 85, rank: "Supreme Hashira" },
    { level: 90, rank: "Demon Slayer Master" },
    { level: 95, rank: "Ultimate Hashira" },
    { level: 100, rank: "Infinity Hashira" },
  ];
  
  class LevelSystem {
    static RANKS = RANKS;
    constructor(data) {
      this.data = data ?? {};
      this.data.xp ??= 0;
    }
  
    getXP() {
      return this.data.xp;
    }
  
    addXP(exp) {
      this.data.xp += exp;
    }
  
    setXP(xp) {
      this.data.xp = Math.max(0, xp);
    }
  
    getLevel() {
      return Math.floor(0.1 * Math.sqrt(this.getXP()));
    }
  
    getRank() {
      let level = this.getLevel();
      let rank = RANKS.findLast((r) => level >= r.level);
      return rank ? rank.rank : RANKS[RANKS.length - 1]?.rank;
    }
  
    setUsername(username) {
      this.data.username = username;
    }
  
    getUsername() {
      return this.data.username || "Unknown";
    }
  
    export() {
      return JSON.parse(JSON.stringify(this.data));
    }
  }
  
  module.exports = LevelSystem;