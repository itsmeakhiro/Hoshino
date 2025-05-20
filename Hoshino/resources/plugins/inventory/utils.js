class Inventory {
  constructor(inventory = [], limit = Infinity) {
    inventory ??= [];
    this.limit = limit;
    this.inv = this.sanitize(JSON.parse(JSON.stringify(inventory)));
  }

  sanitize(inv = this.inv) {
    if (!Array.isArray(inv)) {
      throw new Error("Inventory must be an array.");
    }
    let result = inv.slice(0, this.limit).map((item, index) => {
      const {
        name = "Unknown Item",
        key = "",
        flavorText = "Mysteriously not known to anyone.",
        icon = "❓",
        type = "generic",
        cannotToss = false,
        sellPrice = 0,
      } = item;
      if (!key) {
        console.warn(`Item at index ${index} has no key and will be ignored.`);
        return null;
      }
      let result = {
        ...item,
        name: String(name),
        key: String(key).replaceAll(" ", ""),
        flavorText: String(flavorText),
        icon: String(icon),
        type: String(type),
        index: Number(index),
        sellPrice: parseInt(sellPrice),
        cannotToss: !!cannotToss,
      };
      if (type === "food" || type === "potion") {
        result.heal ??= 0;
        result.mana ??= 0;
        result.heal = parseInt(result.heal);
        result.mana = parseInt(result.mana);
      }
      if (type === "weapon" || type === "armor") {
        result.atk ??= 0;
        result.def ??= 0;
        result.atk = parseFloat(result.atk);
        result.def = parseFloat(result.def);
      }
      if (type === "chest") {
        result.contents ??= [];
        result.contents = Array.isArray(result.contents) ? result.contents : [];
      }
      if (type === "utility") {
        result.utilityEffect ??= 0;
        result.utilityEffect = parseFloat(result.utilityEffect);
      }
      return result;
    });
    return result.filter(Boolean);
  }

  at(index) {
    const parsedIndex = parseInt(index);
    return isNaN(parsedIndex) ? undefined : this.inv.at(parsedIndex - 1);
  }

  getOne(key) {
    return this.inv.find((item) => item.key === key) || this.at(key);
  }

  get(key) {
    return this.inv.filter(
      (item) => item.key === key || item.key === this.keyAt(key)
    );
  }

  getAll() {
    return this.inv;
  }

  deleteRef(item) {
    let index = this.inv.indexOf(item);
    if (index === -1) {
      index = parseInt(item) - 1;
    }
    if (index !== -1 && !isNaN(index)) {
      this.inv.splice(index, 1);
    }
  }

  deleteRefs(items) {
    for (const item of items) {
      this.deleteRef(item);
    }
  }

  findKey(callback) {
    const result = this.inv.find((item) => callback(item) || this.keyAt(item));
    if (result) {
      return result.key;
    } else {
      return null;
    }
  }

  indexOf(item) {
    return this.inv.indexOf(item);
  }

  size() {
    return this.inv.length;
  }

  clone() {
    return new Inventory(this.inv);
  }

  toJSON() {
    return this.inv;
  }

  deleteOne(key) {
    let index = this.inv.findIndex(
      (item) => item.key === key || item.key === this.keyAt(key)
    );
    if (index === -1) {
      index = parseInt(key) - 1;
    }
    if (index === -1 || isNaN(index)) {
      return false;
    }
    this.inv = this.inv.filter((_, i) => i !== index);
  }

  keyAt(index) {
    return this.at(index)?.key;
  }

  delete(key) {
    this.inv = this.inv.filter(
      (item) => item.key !== key && item.key !== this.keyAt(key)
    );
  }

  has(key) {
    return this.inv.some(
      (item) => item.key === key || item.key === this.keyAt(key)
    );
  }

  hasAmount(key, amount) {
    const length = this.getAmount(key);
    return length >= amount;
  }

  getAmount(key) {
    return this.get(key).length;
  }

  addOne(item) {
    if (this.inv.length >= this.limit) {
      throw new Error("Inventory limit reached.");
    }
    this.inv.push(this.sanitize([item])[0]);
    return this.inv.length;
  }

  add(item) {
    const items = Array.isArray(item) ? item : [item];
    const sanitized = this.sanitize(items);
    if (this.inv.length + sanitized.length > this.limit) {
      throw new Error("Adding items would exceed inventory limit.");
    }
    this.inv.push(...sanitized);
    return this.inv.length;
  }

  toss(key, amount) {
    if (amount === "all") {
      amount = this.getAmount(key);
    }
    for (let i = 0; i < amount; i++) {
      this.deleteOne(key);
    }
  }

  tossDEPRECATED(key, amount) {
    if (amount === "all") {
      const i = this.getAmount(key);
      this.delete(key);
      return i;
    }
    let r = 0;
    for (let i = 0; i < amount; i++) {
      if (!this.has(key)) {
        break;
      }
      this.deleteOne(key);
      r++;
    }
    return r;
  }

  setAmount(key, amount) {
    const data = this.get(key);
    for (let i = 0; i < amount; i++) {
      this.addOne(data[i]);
    }
  }

  *[Symbol.iterator]() {
    yield* this.inv;
  }

  raw() {
    return Array.from(this.inv);
  }

  export() {
    return {
      inventory: this.raw(),
    };
  }

  *keys() {
    yield* this.inv.map((item) => item.key);
  }

  useItem(key, user) {
    const item = this.getOne(key);
    if (!item) {
      throw new Error(`Item with key ${key} does not exist in the inventory.`);
    }
    if (item.type === "chest") {
      if (!item.contents || !Array.isArray(item.contents)) {
        throw new Error(`Chest with key ${key} has no valid contents.`);
      }
      for (const content of item.contents) {
        this.addOne(content);
      }
      this.deleteOne(key);
      return { opened: true, contents: item.contents };
    } else if (item.type === "food" || item.type === "potion") {
      if (!user || !user.setHealth || !user.setMana) {
        throw new Error(
          "Invalid user object: Must have setHealth and setMana methods."
        );
      }
      if (item.heal > 0) {
        const currentHealth = user.getHealth();
        const newHealth = currentHealth + item.heal;
        user.setHealth(newHealth);
      }
      if (item.mana > 0) {
        const currentMana = user.getMana();
        const newMana = currentMana + item.mana;
        user.setMana(newMana);
      }
      this.deleteOne(key);
      return true;
    } else {
      throw new Error(`Item with key ${key} cannot be used.`);
    }
  }

  equipItem(key, user) {
    const item = this.getOne(key);
    if (!item) {
      throw new Error(`Item with key ${key} does not exist in the inventory.`);
    }
    if (item.type !== "weapon" && item.type !== "armor" && item.type !== "utility") {
      throw new Error(`Item with key ${key} is not a weapon, armor, or utility item and cannot be equipped.`);
    }
    if (!user || typeof user.setAtk !== "function" || typeof user.setDef !== "function" || typeof user.setUtility !== "function") {
      throw new Error("Invalid user object: Must have setAtk, setDef, and setUtility methods.");
    }
    if (item.type === "weapon") {
      const currentAtk = user.getAtk ? user.getAtk() : 0;
      user.setAtk(currentAtk + item.atk);
    } else if (item.type === "armor") {
      const currentDef = user.getDef ? user.getDef() : 0;
      user.setDef(currentDef + item.def);
    } else if (item.type === "utility") {
      const currentUtility = user.getUtility ? user.getUtility() : 0;
      user.setUtility(currentUtility + item.utilityEffect);
    }
    this.deleteOne(key);
    return true;
  }

  unequipItem(item, user) {
    if (!item || !item.key || !item.type) {
      throw new Error("Invalid item: Must have key and type properties.");
    }
    if (item.type !== "weapon" && item.type !== "armor" && item.type !== "utility") {
      throw new Error(`Item with key ${item.key} is not a weapon, armor, or utility item and cannot be unequipped.`);
    }
    if (!user || typeof user.setAtk !== "function" || typeof user.setDef !== "function" || typeof user.setUtility !== "function") {
      throw new Error("Invalid user object: Must have setAtk, setDef, and setUtility methods.");
    }
    if (this.inv.length >= this.limit) {
      throw new Error("Cannot unequip item: Inventory limit reached.");
    }
    if (item.type === "weapon") {
      const currentAtk = user.getAtk ? user.getAtk() : 0;
      user.setAtk(currentAtk - item.atk);
    } else if (item.type === "armor") {
      const currentDef = user.getDef ? user.getDef() : 0;
      user.setDef(currentDef - item.def);
    } else if (item.type === "utility") {
      const currentUtility = user.getUtility ? user.getUtility() : 0;
      user.setUtility(currentUtility - item.utilityEffect);
    }
    this.addOne(item);
    return true;
  }
}

module.exports = Inventory;
