class LevelingSystem {
  constructor({
    level = 1,
    xp = 0,
    maxLevel = 100,
    baseStats = { health: 100, mana: 50 },
    statGrowth = { health: 10, mana: 5 },
    storage = { type: 'manager', manager: null },
    quests = {},
    rankNames = [
      "Mizunoto",
      "Mizunoe",
      "Kanoto",
      "Kanoe",
      "Tsuchinoto",
      "Tsuchinoe",
      "Hinoto",
      "Hinoe",
      "Kinoto",
      "Kinoe",
      "Hashira Initiate",
      "Hashira of Water",
      "Hashira of Flame",
      "Hashira of Wind",
      "Hashira of Stone",
      "Hashira of Thunder",
      "Hashira of Mist",
      "Hashira of Sound",
      "Hashira of Love",
      "Hashira of Serpent",
      "Master Hashira",
      "Legendary Hashira",
      "Demon Slayer Elite",
      "Moonlit Slayer",
      "Sunlit Slayer",
      "Breath Master",
      "Demon Bane",
      "Pillar of Eternity",
      "Slayer Sovereign",
      "Transcendent Slayer"
    ]
  } = {}) {
    this.maxLevel = Math.max(1, Math.floor(maxLevel));
    this.level = Math.max(1, Math.min(this.maxLevel, Math.floor(level)));
    this.xp = Math.max(0, Math.floor(xp));
    this.baseStats = this.sanitizeStats(baseStats);
    this.statGrowth = this.sanitizeStats(statGrowth);
    this.currentStats = this.calculateCurrentStats();
    this.xpToNextLevel = this.calculateXpToNextLevel();
    this.storage = storage;
    this.quests = { ...quests };
    this.rankNames = Array.isArray(rankNames) && rankNames.length > 0 ? rankNames : ["Mizunoto"];
    this.dataCache = new Map();
    if (this.storage.type !== 'manager' || !this.storage.manager) {
      throw new Error('A valid storage manager is required.');
    }
  }

  sanitizeStats(stats) {
    const result = {};
    for (const [key, value] of Object.entries(stats)) {
      const num = parseFloat(value);
      result[key] = isNaN(num) ? 0 : Math.max(0, num);
    }
    return result;
  }

  calculateCurrentStats() {
    const stats = { health: 100, mana: 50, ...this.baseStats };
    stats.health = this.baseStats.health * Math.pow(2, this.level - 1);
    stats.health = Math.max(0, Math.round(stats.health));
    for (const [stat, growth] of Object.entries(this.statGrowth)) {
      if (stat !== 'health') {
        stats[stat] = (stats[stat] || 0) + growth * (this.level - 1);
        stats[stat] = Math.max(0, Math.round(stats[stat]));
      }
    }
    return stats;
  }

  calculateXpToNextLevel() {
    if (this.level >= this.maxLevel) return Infinity;
    return this.level <= 1 ? 10 : 10 * Math.pow(2, this.level);
  }

  getLevel() {
    return this.xp < 10 ? 1 : Math.min(this.maxLevel, Math.floor(Math.log2(this.xp / 10)) + 1);
  }

  getXpFromLevel(level) {
    if (level <= 1) return 0;
    return 10 * Math.pow(2, level - 1);
  }

  getNextRemainingXp() {
    const currentLevel = this.getLevel();
    const nextLevelXp = this.getXpFromLevel(currentLevel + 1);
    return nextLevelXp - this.xp;
  }

  getNextXp() {
    const currentLevel = this.getLevel();
    return this.getXpFromLevel(currentLevel + 1);
  }

  getExpCurrentLevel() {
    const currentLevel = this.getLevel();
    const previousLevelXp = this.getXpFromLevel(currentLevel - 1);
    return this.xp - previousLevelXp;
  }

  getRankString() {
    const level = this.getLevel();
    return this.rankNames[Math.max(0, Math.min(level - 1, this.rankNames.length - 1))];
  }

  expReached(xp) {
    return this.xp >= xp;
  }

  levelReached(level) {
    return this.getLevel() >= level;
  }

  get exp() {
    return this.xp;
  }

  set exp(value) {
    this.xp = Math.max(0, Math.floor(value));
    this.level = this.getLevel();
    this.xpToNextLevel = this.calculateXpToNextLevel();
    this.currentStats = this.calculateCurrentStats();
  }

  get level() {
    return this.getLevel();
  }

  set level(value) {
    this.exp = this.getXpFromLevel(value);
  }

  async loadUserData() {
    if (this.dataCache.has('default')) {
      return this.dataCache.get('default');
    }
    try {
      if (!this.storage.manager || typeof this.storage.manager.getUserData !== 'function') {
        throw new Error('Storage manager with getUserData method is not available.');
      }
      const userData = await this.storage.manager.getUserData('default');
      if (userData) {
        this.dataCache.set('default', userData);
        this.quests = userData.quests || {};
        this.level = userData.level || 1;
        this.xp = userData.xp || 0;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.currentStats = this.calculateCurrentStats();
      }
      return userData || null;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return null;
    }
  }

  async saveUserData(data) {
    try {
      if (!this.storage.manager || typeof this.storage.manager.setUserData !== 'function') {
        throw new Error('Storage manager with setUserData method is not available.');
      }
      this.dataCache.set('default', data);
      await this.storage.manager.setUserData('default', { ...data, quests: this.quests });
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  }

  async addXp(xp) {
    xp = Math.max(0, Math.floor(xp));
    if (xp === 0 || this.level >= this.maxLevel) {
      return { levelsGained: 0, newStats: this.currentStats };
    }
    this.xp += xp;
    let levelsGained = 0;
    let previousLevel = this.level;
    this.level = this.getLevel();
    levelsGained = this.level - previousLevel;
    this.xpToNextLevel = this.calculateXpToNextLevel();
    this.currentStats = this.calculateCurrentStats();
    if (this.level >= this.maxLevel) {
      this.xp = this.getXpFromLevel(this.maxLevel);
      this.xpToNextLevel = Infinity;
    }
    await this.saveUserData(this.export());
    return { levelsGained, newStats: this.currentStats };
  }

  getXp() {
    return this.xp;
  }

  getXpToNextLevel() {
    return this.xpToNextLevel;
  }

  getStats() {
    return { ...this.currentStats };
  }

  canLevelUp() {
    return this.level < this.maxLevel && this.xp >= this.getNextXp();
  }

  newQuest(questKey, name, description, totalSteps = 10) {
    if (this.quests[questKey]) {
      throw new Error(`Quest with key ${questKey} already exists.`);
    }
    this.quests[questKey] = {
      name,
      description,
      currentSteps: 0,
      totalSteps: Math.max(1, Math.floor(totalSteps)),
      isComplete: false
    };
  }

  async advanceQuest(questKey, steps = 1) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    quest.currentSteps = Math.max(0, quest.currentSteps + Math.floor(steps));
    quest.isComplete = quest.currentSteps >= quest.totalSteps;
    await this.saveUserData(this.export());
  }

  async completeQuest(questKey, xpReward = 0) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    if (!quest.isComplete) {
      throw new Error(`Quest with key ${questKey} is not complete.`);
    }
    delete this.quests[questKey];
    let result = { levelsGained: 0, newStats: this.currentStats };
    if (xpReward > 0) {
      result = await this.addXp(xpReward);
    }
    await this.saveUserData(this.export());
    return result;
  }

  deleteQuest(questKey) {
    if (!this.quests[questKey]) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    delete this.quests[questKey];
  }

  isQuestComplete(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return quest.isComplete;
  }

  hasQuest(questKey) {
    return !!this.quests[questKey];
  }

  async advanceQuestIfHas(questKey, steps = 1) {
    if (this.hasQuest(questKey)) {
      await this.advanceQuest(questKey, steps);
    }
  }

  getQuestInfo(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return { ...quest };
  }

  resetQuest(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    quest.currentSteps = 0;
    quest.isComplete = false;
  }

  async reset(config = {}) {
    const defaults = {
      level: 1,
      xp: 0,
      maxLevel: this.maxLevel,
      baseStats: { health: 100, mana: 50, ...this.baseStats },
      statGrowth: { health: 10, mana: 5, ...this.statGrowth },
      storage: this.storage,
      quests: {},
      rankNames: this.rankNames
    };
    Object.assign(this, new LevelingSystem({ ...defaults, ...config }));
    await this.saveUserData(this.export());
  }

  export() {
    return {
      level: this.level,
      xp: this.xp,
      maxLevel: this.maxLevel,
      baseStats: { ...this.baseStats },
      statGrowth: { ...this.statGrowth },
      currentStats: { ...this.currentStats },
      xpToNextLevel: this.xpToNextLevel,
      quests: { ...this.quests }
    };
  }

  *[Symbol.iterator]() {
    yield { level: this.level, xp: this.xp, stats: this.currentStats, quests: this.quests };
  }
}

module.exports = LevelingSystem;
