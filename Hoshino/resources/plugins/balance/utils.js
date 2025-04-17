class BalanceHandler {
  /**
   * Initializes a balance handler for user currency, integrated with a leveling system.
   * @param {Object} config - Configuration for the balance handler.
   * @param {string} [config.username] - Username for the user.
   * @param {number} [config.initialBalance=0] - Initial balance for new users.
   * @param {LevelingSystem} config.levelingSystem - LevelingSystem instance for registration checks.
   */
  constructor({
    username,
    initialBalance = 0,
    levelingSystem,
  } = {}) {
    if (!levelingSystem || !(levelingSystem instanceof require('./LevelingSystem'))) {
      throw new Error('A valid LevelingSystem instance is required.');
    }
    this.username = username ? String(username).trim() : undefined;
    this.initialBalance = Math.max(0, Math.floor(initialBalance));
    this.levelingSystem = levelingSystem;
    this.balance = this.initialBalance;
  }

  /**
   * Checks if the user is registered in the LevelingSystem and loads their balance.
   * @throws {Error} If no user is registered or not found in LevelingSystem.
   */
  async checkRegistered() {
    if (!this.username) {
      throw new Error('No user specified. Provide a username.');
    }
    const userData = await this.levelingSystem.loadUserData(this.username);
    if (!userData) {
      throw new Error(`User ${this.username} is not registered in the LevelingSystem.`);
    }
    this.balance = Math.max(0, Math.floor(userData.balance || this.initialBalance));
  }

  /**
   * Saves the user’s balance to the LevelingSystem storage.
   */
  async saveBalance() {
    await this.checkRegistered();
    const userData = await this.levelingSystem.loadUserData(this.username);
    if (userData) {
      userData.balance = this.balance;
      await this.levelingSystem.saveUserData(this.username, userData);
    }
  }

  /**
   * Gets the user’s current balance.
   * @returns {Promise<number>} Current balance.
   */
  async getBalance() {
    await this.checkRegistered();
    return this.balance;
  }

  /**
   * Adds credits to the user’s balance.
   * @param {number} amount - Amount to add.
   * @returns {Promise<number>} New balance.
   */
  async add(amount) {
    await this.checkRegistered();
    amount = Math.max(0, Math.floor(amount));
    this.balance += amount;
    await this.saveBalance();
    return this.balance;
  }

  /**
   * Spends credits from the user’s balance.
   * @param {number} amount - Amount to spend.
   * @returns {Promise<boolean>} True if successful, false if insufficient funds.
   */
  async spend(amount) {
    await this.checkRegistered();
    amount = Math.max(0, Math.floor(amount));
    if (this.balance < amount) {
      return false;
    }
    this.balance -= amount;
    await this.saveBalance();
    return true;
  }

  /**
   * Transfers credits to another user.
   * @param {string} toUsername - Recipient’s username.
   * @param {number} amount - Amount to transfer.
   * @returns {Promise<boolean>} True if successful, false if invalid or insufficient funds.
   */
  async transfer(toUsername, amount) {
    await this.checkRegistered();
    if (!toUsername || typeof toUsername !== 'string' || !toUsername.trim()) {
      return false;
    }
    const cleanToUsername = String(toUsername).trim();
    if (cleanToUsername === this.username) {
      return false;
    }
    amount = Math.max(0, Math.floor(amount));
    if (this.balance < amount) {
      return false;
    }
    const toUserData = await this.levelingSystem.loadUserData(cleanToUsername);
    if (!toUserData) {
      return false;
    }
    this.balance -= amount;
    toUserData.balance = Math.max(0, Math.floor(toUserData.balance || this.initialBalance)) + amount;
    await this.levelingSystem.saveUserData(this.username, {
      ...await this.levelingSystem.loadUserData(this.username),
      balance: this.balance,
    });
    await this.levelingSystem.saveUserData(cleanToUsername, toUserData);
    return true;
  }

  /**
   * Sets the user’s balance to a specific amount.
   * @param {number} amount - New balance.
   * @returns {Promise<number>} New balance.
   */
  async setBalance(amount) {
    await this.checkRegistered();
    this.balance = Math.max(0, Math.floor(amount));
    await this.saveBalance();
    return this.balance;
  }

  /**
   * Checks if the user has at least the specified amount.
   * @param {number} amount - Amount to check.
   * @returns {Promise<boolean>} True if sufficient funds.
   */
  async hasAmount(amount) {
    await this.checkRegistered();
    amount = Math.max(0, Math.floor(amount));
    return this.balance >= amount;
  }

  /**
   * Exports the current balance state.
   * @returns {Promise<Object>} Balance data.
   */
  async export() {
    await this.checkRegistered();
    return {
      username: this.username,
      balance: this.balance,
    };
  }

  /**
   * Makes the balance handler iterable (yields username and balance).
   */
  async *[Symbol.iterator]() {
    await this.checkRegistered();
    yield { username: this.username, balance: this.balance };
  }
}

module.exports = BalanceHandler;