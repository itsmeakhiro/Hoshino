class Inventory {
  /**
   * Initializes an inventory for a user, integrated with a leveling system.
   * @param {Object} config - Configuration for the inventory.
   * @param {string} [config.username] - Username for the user.
   * @param {Array} [config.inventory=[]] - Initial inventory items.
   * @param {number} [config.limit=Infinity] - Maximum number of items.
   * @param {LevelingSystem} config.levelingSystem - LevelingSystem instance for registration checks.
   */
  constructor({
    username,
    inventory = [],
    limit = Infinity,
    levelingSystem,
  } = {}) {
    if (!levelingSystem || !(levelingSystem instanceof require('../Hoshino/resources/plugins/level/utils'))) {
      throw new Error('A valid LevelingSystem instance is required.');
    }
    inventory ??= [];
    this.username = username ? String(username).trim() : undefined;
    this.limit = Math.max(1, Math.floor(limit));
    this.inv = this.sanitize(JSON.parse(JSON.stringify(inventory)));
    this.levelingSystem = levelingSystem;
  }

  /**
   * Sanitizes inventory items to ensure valid structure.
   * @param {Array} inv - Inventory to sanitize.
   * @returns {Array} Sanitized inventory.
   */
  sanitize(inv = this.inv) {
    if (!Array.isArray(inv)) {
      throw new Error('Inventory must be an array.');
    }
    let result = inv.slice(0, this.limit).map((item, index) => {
      const {
        name = 'Unknown Item',
        key = '',
        flavorText = 'Mysteriously not known to anyone.',
        icon = '❓',
        type = 'generic',
        cannotToss = false,
        sellPrice = 0,
      } = item;
      if (!key) {
        return;
      }
      let result = {
        ...item,
        name: String(name),
        key: String(key).replaceAll(' ', ''),
        flavorText: String(flavorText),
        icon: String(icon),
        type: String(type),
        index: Number(index),
        sellPrice: parseInt(sellPrice) || 0,
        cannotToss: !!cannotToss,
      };
      if (type === 'food') {
        result.heal ??= 0;
        result.heal = parseInt(result.heal) || 0;
      }
      if (type === 'weapon' || type === 'armor') {
        result.atk ??= 0;
        result.def ??= 0;
        result.atk = parseFloat(result.atk) || 0;
        result.def = parseFloat(result.def) || 0;
      }
      return result;
    });
    return result.filter(Boolean);
  }

  /**
   * Checks if the user is registered in the LevelingSystem and loads their inventory.
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
    this.inv = this.sanitize(userData.inventory || this.inv);
  }

  /**
   * Gets item at index (1-based).
   * @param {number} index - Index of item.
   * @returns {Object|undefined} Item or undefined.
   */
  async at(index) {
    await this.checkRegistered();
    const parsedIndex = parseInt(index);
    return isNaN(parsedIndex) ? undefined : this.inv.at(parsedIndex - 1);
  }

  /**
   * Gets first item by key or index.
   * @param {string|number} key - Item key or index.
   * @returns {Object|undefined} Item or undefined.
   */
  async getOne(key) {
    await this.checkRegistered();
    return this.inv.find((item) => item.key === key) || (await this.at(key));
  }

  /**
   * Gets all items by key or index.
   * @param {string|number} key - Item key or index.
   * @returns {Array} Matching items.
   */
  async get(key) {
    await this.checkRegistered();
    const keyAt = await this.keyAt(key);
    return this.inv.filter((item) => item.key === key || (keyAt && item.key === keyAt));
  }

  /**
   * Gets all items.
   * @returns {Array} All items.
   */
  async getAll() {
    await this.checkRegistered();
    return this.inv;
  }

  /**
   * Deletes an item reference.
   * @param {Object|number} item - Item or index.
   */
  async deleteRef(item) {
    await this.checkRegistered();
    let index = this.inv.indexOf(item);
    if (index === -1) {
      index = parseInt(item) - 1;
    }
    if (index !== -1 && !isNaN(index)) {
      this.inv.splice(index, 1);
      await this.saveInventory();
    }
  }

  /**
   * Deletes multiple item references.
   * @param {Array} items - Items or indices.
   */
  async deleteRefs(items) {
    await this.checkRegistered();
    for (const item of items) {
      await this.deleteRef(item);
    }
  }

  /**
   * Finds an item key by callback.
   * @param {Function} callback - Callback to match item.
   * @returns {string|null} Item key or null.
   */
  async findKey(callback) {
    await this.checkRegistered();
    const result = this.inv.find((item) => callback(item));
    return result ? result.key : null;
  }

  /**
   * Gets index of an item.
   * @param {Object} item - Item to find.
   * @returns {number} Index or -1.
   */
  async indexOf(item) {
    await this.checkRegistered();
    return this.inv.indexOf(item);
  }

  /**
   * Gets inventory size.
   * @returns {number} Number of items.
   */
  async size() {
    await this.checkRegistered();
    return this.inv.length;
  }

  /**
   * Serializes inventory to JSON.
   * @returns {Array} Inventory array.
   */
  async toJSON() {
    await this.checkRegistered();
    return this.inv;
  }

  /**
   * Deletes one item by key or index.
   * @param {string|number} key - Item key or index.
   * @returns {Promise<boolean>} True if deleted, false if not found.
   */
  async deleteOne(key) {
    await this.checkRegistered();
    let index = this.inv.findIndex((item) => item.key === key || item.key === (await this.keyAt(key)));
    if (index === -1) {
      index = parseInt(key) - 1;
    }
    if (index === -1 || isNaN(index)) {
      return false;
    }
    this.inv.splice(index, 1);
    await this.saveInventory();
    return true;
  }

  /**
   * Gets key at index (1-based).
   * @param {number} index - Index of item.
   * @returns {string|undefined} Item key or undefined.
   */
  async keyAt(index) {
    await this.checkRegistered();
    return (await this.at(index))?.key;
  }

  /**
   * Deletes all items by key.
   * @param {string} key - Item key.
   */
  async delete(key) {
    await this.checkRegistered();
    const keyAt = await this.keyAt(key);
    this.inv = this.inv.filter((item) => item.key !== key && item.key !== keyAt);
    await this.saveInventory();
  }

  /**
   * Checks if an item exists by key or index.
   * @param {string|number} key - Item key or index.
   * @returns {boolean} True if item exists.
   */
  async has(key) {
    await this.checkRegistered();
    return this.inv.some((item) => item.key === key || item.key === (await this.keyAt(key)));
  }

  /**
   * Checks if at least `amount` items exist by key.
   * @param {string} key - Item key.
   * @param {number} amount - Required amount.
   * @returns {boolean} True if enough items exist.
   */
  async hasAmount(key, amount) {
    await this.checkRegistered();
    const length = await this.getAmount(key);
    return length >= amount;
  }

  /**
   * Gets number of items by key.
   * @param {string} key - Item key.
   * @returns {number} Number of items.
   */
  async getAmount(key) {
    await this.checkRegistered();
    return (await this.get(key)).length;
  }

  /**
   * Adds one item to the inventory.
   * @param {Object} item - Item to add.
   * @returns {Promise<number>} New inventory size.
   */
  async addOne(item) {
    await this.checkRegistered();
    if (this.inv.length >= this.limit) {
      throw new Error('Inventory limit reached.');
    }
    const sanitizedItem = this.sanitize([item])[0];
    if (!sanitizedItem) {
      throw new Error('Invalid item.');
    }
    this.inv.push(sanitizedItem);
    await this.saveInventory();
    return this.inv.length;
  }

  /**
   * Adds multiple items to the inventory.
   * @param {Array} items - Items to add.
   * @returns {Promise<number>} New inventory size.
   */
  async add(items) {
    await this.checkRegistered();
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array.');
    }
    const newItems = this.sanitize(items);
    if (this.inv.length + newItems.length > this.limit) {
      throw new Error('Adding items would exceed inventory limit.');
    }
    this.inv.push(...newItems);
    await this.saveInventory();
    return this.inv.length;
  }

  /**
   * Tosses (removes) items by key.
   * @param {string} key - Item key.
   * @param {number|string} amount - Number of items or 'all'.
   * @returns {Promise<number>} Number of items tossed.
   */
  async toss(key, amount) {
    await this.checkRegistered();
    if (amount === 'all') {
      amount = await this.getAmount(key);
    }
    amount = Math.max(0, Math.floor(amount));
    let tossed = 0;
    for (let i = 0; i < amount; i++) {
      if (await this.deleteOne(key)) {
        tossed++;
      } else {
        break;
      }
    }
    await this.saveInventory();
    return tossed;
  }

  /**
   * Deprecated toss method.
   * @deprecated Use toss() instead.
   */
  async tossDEPRECATED(key, amount) {
    await this.checkRegistered();
    if (amount === 'all') {
      const count = await this.getAmount(key);
      await this.delete(key);
      return count;
    }
    let tossed = 0;
    amount = Math.max(0, Math.floor(amount));
    for (let i = 0; i < amount; i++) {
      if (!(await this.has(key))) {
        break;
      }
      await this.deleteOne(key);
      tossed++;
    }
    await this.saveInventory();
    return tossed;
  }

  /**
   * Sets the amount of an item by key.
   * @param {string} key - Item key.
   * @param {number} amount - Desired amount.
   */
  async setAmount(key, amount) {
    await this.checkRegistered();
    amount = Math.max(0, Math.floor(amount));
    const current = await this.get(key);
    const template = current[0] || { key, name: 'Unknown Item', type: 'generic' };
    await this.delete(key);
    for (let i = 0; i < amount; i++) {
      await this.addOne({ ...template });
    }
    await this.saveInventory();
  }

  /**
   * Saves the inventory to the LevelingSystem storage.
   */
  async saveInventory() {
    await this.checkRegistered();
    const userData = await this.levelingSystem.loadUserData(this.username);
    if (userData) {
      userData.inventory = this.inv;
      await this.levelingSystem.saveUserData(this.username, userData);
    }
  }

  /**
   * Makes inventory iterable.
   */
  async *[Symbol.iterator]() {
    await this.checkRegistered();
    yield* this.inv;
  }

  /**
   * Returns a shallow copy of the inventory.
   * @returns {Array} Inventory copy.
   */
  async raw() {
    await this.checkRegistered();
    return Array.from(this.inv);
  }

  /**
   * Exports inventory state.
   * @returns {Object} Inventory data.
   */
  async export() {
    await this.checkRegistered();
    return {
      username: this.username,
      inventory: await this.raw(),
      limit: this.limit,
    };
  }

  /**
   * Yields all item keys.
   */
  async *keys() {
    await this.checkRegistered();
    yield* this.inv.map((item) => item.key);
  }
}

module.exports = Inventory;
