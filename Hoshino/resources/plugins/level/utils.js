const fs = require('fs').promises;
const path = require('path');

class LevelingSystem {
  /**
   * Initializes a leveling system for a character or user.
   * @param {Object} config - Configuration for the leveling system.
   * @param {string} [config.username] - Username for the user (optional for single-user systems).
   * @param {number} [config.level=1] - Starting level.
   * @param {number} [config.xp=0] - Starting experience points.
   * @param {number} [config.maxLevel=100] - Maximum level cap.
   * @param {Function} [config.xpRequiredFormula] - Function to calculate XP needed for a level.
   * @param {Object} [config.baseStats={}] - Base stats for the character.
   * @param {Object} [config.statGrowth={}] - Stat growth per level.
   * @param {Object} [config.storage] - Storage manager (e.g., UserStatsManager or JSON file path).
   */
  constructor({
    username,
    level = 1,
    xp = 0,
    maxLevel = 100,
    xpRequiredFormula = (lvl) => Math.round(100 * Math.pow(1.1, lvl - 1)),
    baseStats = {},
    statGrowth = {},
    storage = { type: 'json', path: path.join(__dirname, 'levelingData.json') },
  } = {}) {
    this.username = username ? String(username).trim() : undefined;
    this.maxLevel = Math.max(1, Math.floor(maxLevel));
    this.level = Math.max(1, Math.min(this.maxLevel, Math.floor(level)));
    this.xp = Math.max(0, Math.floor(xp));
    this.xpRequiredFormula = xpRequiredFormula;
    this.baseStats = this.sanitizeStats(baseStats);
    this.statGrowth = this.sanitizeStats(statGrowth);
    this.currentStats = this.calculateCurrentStats();
    this.xpToNextLevel = this.calculateXpToNextLevel();
    this.storage = storage;
    this.dataCache = new Map();
  }

  /**
   * Sanitizes stat objects to ensure valid numbers.
   * @param {Object} stats - Stats object to sanitize.
   * @returns {Object} Sanitized stats.
   */
  sanitizeStats(stats) {
    const result = {};
    for (const [key, value] of Object.entries(stats)) {
      const num = parseFloat(value);
      result[key] = isNaN(num) ? 0 : Math.max(0, num);
    }
    return result;
  }

  /**
   * Calculates the current stats based on level and growth.
   * @returns {Object} Current stats.
   */
  calculateCurrentStats() {
    const stats = { ...this.baseStats };
    for (const [stat, growth] of Object.entries(this.statGrowth)) {
      stats[stat] = (stats[stat] || 0) + growth * (this.level - 1);
      stats[stat] = Math.max(0, Math.round(stats[stat]));
    }
    return stats;
  }

  /**
   * Calculates XP required to reach the next level.
   * @returns {number} XP needed for the next level.
   */
  calculateXpToNextLevel() {
    if (this.level >= this.maxLevel) return Infinity;
    return this.xpRequiredFormula(this.level + 1);
  }

  /**
   * Registers a user with initial leveling data.
   * @param {string} username - Username to register.
   * @param {Object} [initialData] - Optional initial data (e.g., level, xp, stats).
   * @returns {Promise<boolean>} True if registration succeeded, false if user already exists.
   */
  async register(username, initialData = {}) {
    if (!username || typeof username !== 'string' || !username.trim()) {
      throw new Error('Valid username is required.');
    }
    const cleanUsername = String(username).trim();
    const existingData = await this.loadUserData(cleanUsername);
    if (existingData) {
      return false;
    }
    const userData = {
      username: cleanUsername,
      level: initialData.level ?? 1,
      xp: initialData.xp ?? 0,
      baseStats: this.sanitizeStats(initialData.baseStats ?? this.baseStats),
      statGrowth: this.sanitizeStats(initialData.statGrowth ?? this.statGrowth),
    };
    this.username = cleanUsername;
    this.level = Math.max(1, Math.min(this.maxLevel, Math.floor(userData.level)));
    this.xp = Math.max(0, Math.floor(userData.xp));
    this.baseStats = userData.baseStats;
    this.statGrowth = userData.statGrowth;
    this.currentStats = this.calculateCurrentStats();
    this.xpToNextLevel = this.calculateXpToNextLevel();
    await this.saveUserData(cleanUsername, this.export());
    return true;
  }

  /**
   * Loads user data from storage.
   * @param {string} username - Username to load.
   * @returns {Promise<Object|null>} User data or null if not found.
   */
  async loadUserData(username) {
    if (this.dataCache.has(username)) {
      return this.dataCache.get(username);
    }
    try {
      if (this.storage.type === 'json') {
        const filePath = this.storage.path;
        try {
          await fs.access(filePath);
        } catch {
          await fs.writeFile(filePath, JSON.stringify({ users: {} }));
        }
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const userData = data.users?.[username];
        if (userData) {
          this.dataCache.set(username, userData);
        }
        return userData || null;
      } else if (this.storage.type === 'manager' && this.storage.manager) {
        const userData = await this.storage.manager.getUserData(username);
        if (userData) {
          this.dataCache.set(username, userData);
        }
        return userData || null;
      }
      throw new Error('Unsupported storage type.');
    } catch (error) {
      console.error(`Failed to load user data for ${username}:`, error);
      return null;
    }
  }

  /**
   * Saves user data to storage.
   * @param {string} username - Username to save.
   * @param {Object} data - Data to save.
   * @returns {Promise<void>}
   */
  async saveUserData(username, data) {
    try {
      this.dataCache.set(username, data);
      if (this.storage.type === 'json') {
        const filePath = this.storage.path;
        let currentData = {};
        try {
          await fs.access(filePath);
          currentData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        } catch {
          currentData = { users: {} };
        }
        currentData.users = currentData.users || {};
        currentData.users[username] = data;
        await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));
      } else if (this.storage.type === 'manager' && this.storage.manager) {
        await this.storage.manager.setUserData(username, data);
      } else {
        throw new Error('Unsupported storage type.');
      }
    } catch (error) {
      console.error(`Failed to save user data for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Adds XP and handles level-ups.
   * @param {number} xp - XP to add.
   * @returns {Promise<Object>} Result of adding XP (levels gained, new stats).
   */
  async addXp(xp) {
    if (!this.username) {
      throw new Error('No user registered. Call register() first.');
    }
    xp = Math.max(0, Math.floor(xp));
    if (xp === 0 || this.level >= this.maxLevel) {
      return { levelsGained: 0, newStats: this.currentStats };
    }
    this.xp += xp;
    let levelsGained = 0;
    while (this.xp >= this.xpToNextLevel && this.level < this.maxLevel) {
      this.level += 1;
      levelsGained += 1;
      this.xp -= this.xpToNextLevel;
      this.xpToNextLevel = this.calculateXpToNextLevel();
      this.currentStats = this.calculateCurrentStats();
    }
    if (this.level >= this.maxLevel) {
      this.xp = 0;
      this.xpToNextLevel = Infinity;
    }
    await this.saveUserData(this.username, this.export());
    return { levelsGained, newStats: this.currentStats };
  }

  /**
   * Gets the current level.
   * @returns {number} Current level.
   */
  getLevel() {
    return this.level;
  }

  /**
   * Gets the current XP.
   * @returns {number} Current XP.
   */
  getXp() {
    return this.xp;
  }

  /**
   * Gets the XP required to reach the next level.
   * @returns {number} XP to next level.
   */
  getXpToNextLevel() {
    return this.xpToNextLevel;
  }

  /**
   * Gets the current stats.
   * @returns {Object} Current stats.
   */
  getStats() {
    return { ...this.currentStats };
  }

  /**
   * Checks if the character can level up with the current XP.
   * @returns {boolean} True if level-up is possible.
   */
  canLevelUp() {
    return this.level < this.maxLevel && this.xp >= this.xpToNextLevel;
  }

  /**
   * Resets the leveling system for the current user.
   * @param {Object} [config] - Optional new configuration.
   * @returns {Promise<void>}
   */
  async reset(config = {}) {
    if (!this.username) {
      throw new Error('No user registered. Call register() first.');
    }
    const defaults = {
      username: this.username,
      level: 1,
      xp: 0,
      maxLevel: this.maxLevel,
      xpRequiredFormula: this.xpRequiredFormula,
      baseStats: this.baseStats,
      statGrowth: this.statGrowth,
      storage: this.storage,
    };
    Object.assign(this, new LevelingSystem({ ...defaults, ...config }));
    await this.saveUserData(this.username, this.export());
  }

  /**
   * Exports the current state.
   * @returns {Object} State object.
   */
  export() {
    return {
      username: this.username,
      level: this.level,
      xp: this.xp,
      maxLevel: this.maxLevel,
      baseStats: { ...this.baseStats },
      statGrowth: { ...this.statGrowth },
      currentStats: { ...this.currentStats },
      xpToNextLevel: this.xpToNextLevel,
    };
  }

  /**
   * Makes the leveling system iterable (yields level, xp, stats).
   */
  *[Symbol.iterator]() {
    yield { username: this.username, level: this.level, xp: this.xp, stats: this.currentStats };
  }
}

module.exports = LevelingSystem;