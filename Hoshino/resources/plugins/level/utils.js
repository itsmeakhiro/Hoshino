class LevelSystem {
  constructor({
    level = 1,
    xp = 0,
    maxLevel = 100,
    xpCurve = (level) => 100 * level * level,
    health = 100,
    maxHealth = (level) => 100 + level * 50,
    mana = 50,
    maxMana = (level) => 50 + level * 25,
    healthManaUpgradeMode = "full",
    ranks = [
      { name: "Mizunoto", minLevel: 1 },
      { name: "Mizunoe", minLevel: 11 },
      { name: "Kanoto", minLevel: 21 },
      { name: "Kanoe", minLevel: 31 },
      { name: "Tsuchinoto", minLevel: 41 },
      { name: "Tsuchinoe", minLevel: 51 },
      { name: "Hinoto", minLevel: 61 },
      { name: "Hinoe", minLevel: 71 },
      { name: "Kinoto", minLevel: 81 },
      { name: "Kinoe", minLevel: 91 },
      { name: "Hashira", minLevel: 100 },
    ],
  } = {}) {
    this.maxLevel = Math.max(1, parseInt(maxLevel) || 100);
    this.xpCurve = typeof xpCurve === "function" ? xpCurve : () => 100 * level * level;
    this.maxHealth = typeof maxHealth === "function" ? maxHealth : () => 100 + level * 50;
    this.maxMana = typeof maxMana === "function" ? maxMana : () => 50 + level * 25;
    this.healthManaUpgradeMode = healthManaUpgradeMode === "proportional" ? "proportional" : "full";
    this.ranks = Array.isArray(ranks) ? ranks.sort((a, b) => a.minLevel - b.minLevel) : [{ name: "Mizunoto", minLevel: 1 }];

    this.xp = this.sanitizeXP(xp);
    this.healthPercent = this.healthManaUpgradeMode === "proportional" ? health / this.maxHealth(level) : 1;
    this.manaPercent = this.healthManaUpgradeMode === "proportional" ? mana / this.maxMana(level) : 1;
    this.xpToNext = this.calculateXPToNextLevel();
  }

  get level() {
    let totalXP = 0;
    for (let i = 1; i <= this.maxLevel; i++) {
      totalXP += this.xpCurve(i);
      if (this.xp < totalXP) {
        return Math.min(i, this.maxLevel);
      }
    }
    return this.maxLevel;
  }

  get health() {
    return this.healthManaUpgradeMode === "proportional"
      ? this.sanitizeHealth(this.maxHealth(this.level) * this.healthPercent, this.level)
      : this.maxHealth(this.level);
  }

  set health(value) {
    this.healthPercent = this.healthManaUpgradeMode === "proportional"
      ? value / this.maxHealth(this.level)
      : 1;
  }

  get mana() {
    return this.healthManaUpgradeMode === "proportional"
      ? this.sanitizeMana(this.maxMana(this.level) * this.manaPercent, this.level)
      : this.maxMana(this.level);
  }

  set mana(value) {
    this.manaPercent = this.healthManaUpgradeMode === "proportional"
      ? value / this.maxMana(this.level)
      : 1;
  }

  sanitizeLevel(level) {
    const parsed = parseInt(level);
    if (isNaN(parsed)) {
      throw new Error("Level must be a valid number.");
    }
    return Math.max(1, Math.min(this.maxLevel, parsed));
  }

  sanitizeXP(xp) {
    const parsed = parseInt(xp);
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  sanitizeHealth(health, level) {
    const parsed = parseInt(health);
    if (isNaN(parsed)) {
      return this.maxHealth(level);
    }
    return Math.max(0, Math.min(parsed, this.maxHealth(level)));
  }

  sanitizeMana(mana, level) {
    const parsed = parseInt(mana);
    if (isNaN(parsed)) {
      return this.maxMana(level);
    }
    return Math.max(0, Math.min(parsed, this.maxMana(level)));
  }

  calculateXPToNextLevel() {
    if (this.level >= this.maxLevel) {
      return Infinity;
    }
    let totalXP = 0;
    for (let i = 1; i <= this.level; i++) {
      totalXP += this.xpCurve(i);
    }
    return totalXP - this.xp;
  }

  getLevel() {
    return this.level;
  }

  getXP() {
    return this.xp;
  }

  getXPToNext() {
    return this.xpToNext;
  }

  getMaxLevel() {
    return this.maxLevel;
  }

  getHealth() {
    return this.health;
  }

  getMaxHealth() {
    return this.maxHealth(this.level);
  }

  getMana() {
    return this.mana;
  }

  getMaxMana() {
    return this.maxMana(this.level);
  }

  getRank() {
    let currentRank = this.ranks[0];
    for (const rank of this.ranks) {
      if (this.level >= rank.minLevel) {
        currentRank = rank;
      } else {
        break;
      }
    }
    return currentRank.name;
  }

  getRankProgression() {
    return this.ranks.map(rank => ({ name: rank.name, minLevel: rank.minLevel }));
  }

  isMaxLevel() {
    return this.level >= this.maxLevel;
  }

  isAlive() {
    return this.health > 0;
  }

  addXP(amount) {
    if (this.isMaxLevel()) {
      return { leveledUp: false, levelsGained: 0 };
    }

    const parsedAmount = parseInt(amount) || 0;
    if (parsedAmount <= 0) {
      return { leveledUp: false, levelsGained: 0 };
    }

    const previousLevel = this.level;
    this.xp += parsedAmount;
    this.xpToNext = this.calculateXPToNextLevel();
    const levelsGained = this.level - previousLevel;

    if (this.isMaxLevel()) {
      this.xpToNext = Infinity;
    }

    return { leveledUp: levelsGained > 0, levelsGained };
  }

  setLevel(level) {
    const newLevel = this.sanitizeLevel(level);
    if (newLevel === this.level) {
      return false;
    }

    let totalXP = 0;
    for (let i = 1; i < newLevel; i++) {
      totalXP += this.xpCurve(i);
    }
    this.xp = totalXP;
    this.xpToNext = this.calculateXPToNextLevel();
    return true;
  }

  setXP(xp) {
    const previousLevel = this.level;
    this.xp = this.sanitizeXP(xp);
    this.xpToNext = this.calculateXPToNextLevel();
    const levelsGained = this.level - previousLevel;

    if (this.isMaxLevel()) {
      this.xpToNext = Infinity;
    }

    return { leveledUp: levelsGained > 0, levelsGained };
  }

  takeDamage(amount) {
    const parsedAmount = parseInt(amount) || 0;
    if (parsedAmount <= 0) {
      return { healthLost: 0, isAlive: this.isAlive() };
    }

    this.health = this.health - parsedAmount;
    return { healthLost: parsedAmount, isAlive: this.isAlive() };
  }

  restoreHealth(amount) {
    const parsedAmount = parseInt(amount) || 0;
    if (parsedAmount <= 0) {
      return { healthGained: 0 };
    }

    this.health = this.health + parsedAmount;
    return { healthGained: parsedAmount };
  }

  useMana(amount) {
    const parsedAmount = parseInt(amount) || 0;
    if (parsedAmount <= 0 || this.mana < parsedAmount) {
      return { manaUsed: 0, success: false };
    }

    this.mana = this.mana - parsedAmount;
    return { manaUsed: parsedAmount, success: true };
  }

  restoreMana(amount) {
    const parsedAmount = parseInt(amount) || 0;
    if (parsedAmount <= 0) {
      return { manaGained: 0 };
    }

    this.mana = this.mana + parsedAmount;
    return { manaGained: parsedAmount };
  }

  reset() {
    this.xp = 0;
    this.healthPercent = 1;
    this.manaPercent = 1;
    this.xpToNext = this.calculateXPToNextLevel();
  }

  clone() {
    return new LevelSystem({
      xp: this.xp,
      maxLevel: this.maxLevel,
      xpCurve: this.xpCurve,
      health: this.health,
      maxHealth: this.maxHealth,
      mana: this.mana,
      maxMana: this.maxMana,
      healthManaUpgradeMode: this.healthManaUpgradeMode,
      ranks: this.ranks,
    });
  }

  export() {
    return {
      level: this.level,
      xp: this.xp,
      maxLevel: this.maxLevel,
      health: this.health,
      maxHealth: this.maxHealth(this.level),
      mana: this.mana,
      maxMana: this.maxMana(this.level),
      healthManaUpgradeMode: this.healthManaUpgradeMode,
      rank: this.getRank(),
      ranks: this.getRankProgression(),
    };
  }

  toJSON() {
    return this.export();
  }

  *[Symbol.iterator]() {
    for (let i = 1; i <= this.level; i++) {
      let rank = this.ranks[0];
      for (const r of this.ranks) {
        if (i >= r.minLevel) {
          rank = r;
        } else {
          break;
        }
      }
      yield {
        level: i,
        xpRequired: i === 1 ? 0 : this.xpCurve(i - 1),
        maxHealth: this.maxHealth(i),
        maxMana: this.maxMana(i),
        rank: rank.name,
      };
    }
  }
}

module.exports = LevelSystem;
