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
        durability = 100,
      } = item;
      if (!key) {
        return;
      }
      let result = {
        ...item,
        name: String(name),
        key: String(key).replaceAll(" ", ""),
        flavorText: String(flavorText),
        icon: String(icon),
        type: String(type),
        index: Number(index),
        sellPrice: parseInt(sellPrice) || 0,
        cannotToss: !!cannotToss,
        durability: parseInt(durability) || 100,
      };
      if (type === "food" || type === "potion") {
        result.heal ??= 0;
        result.mana ??= 0;
        result.heal = parseInt(result.heal) || 0;
        result.mana = parseInt(result.mana) || 0;
      }
      if (type === "weapon" || type === "armor" || type === "utility") {
        result.atk ??= 0;
        result.def ??= 0;
        result.atk = parseFloat(result.atk) || 0;
        result.def = parseFloat(result.def) || 0;
        result.durability = Math.max(0, parseInt(result.durability) || 100);
      }
      if (type === "chest") {
        result.contents ??= [];
        result.contents = Array.isArray(result.contents) ? result.contents : [];
      }
      if (type === "utility") {
        result.stats ??= {};
        result.stats = typeof result.stats === "object" && !Array.isArray(result.stats) ? result.stats : {};
        for (const [key, value] of Object.entries(result.stats)) {
          result.stats[key] = parseFloat(value) || 0;
        }
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
      return false;
    }
    this.inv.push(this.sanitize([item])[0]);
    return true;
  }

  add(item) {
    if (this.inv.length + item.length > this.limit) {
      return false;
    }
    this.inv.push(...this.sanitize(item));
    return true;
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
    const data = this.getOne(key);
    if (!data) return;
    this.delete(key);
    for (let i = 0; i < amount; i++) {
      this.addOne({ ...data });
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
   const item = this.getOne(String(key)); 
   if (!item) {
    throw new Error(`Item with key ${key} does not exist in the inventory.`);
   }
   if (item.type !== "weapon" && item.type !== "armor") {
    throw new Error(`Item with key ${key} cannot be equipped. Only weapons or armor can be equipped.`);
   }
   if (!user || !user.setAtk || !user.setDef) {
    throw new Error("Invalid user object: Must have setAtk and setDef methods.");
   }
   if (item.durability <= 0) {
    throw new Error(`Item "${item.name}" is broken and cannot be equipped.`);
   }
   if (item.type === "weapon" && item.atk > 0) {
    const currentAtk = user.getAtk ? user.getAtk() : 0;
    const newAtk = currentAtk + item.atk;
    user.setAtk(newAtk);
   }
   if (item.type === "armor" && item.def > 0) {
    const currentDef = user.getDef ? user.getDef() : 0;
    const newDef = currentDef + item.def;
    user.setDef(newDef);
   }
   item.durability = Math.max(0, item.durability - 10);
   if (item.durability === 0) {
    this.deleteOne(String(key)); 
   } else {
    this.inv[this.inv.findIndex((i) => i.key === String(key))] = item;
   }
  return { equipped: true, item: item.name, atk: item.atk || 0, def: item.def || 0, durability: item.durability };
  }

  equipUtility(key, user) {
    const item = this.getOne(key);
    if (!item) {
      throw new Error(`Item with key ${key} does not exist in the inventory.`);
    }
    if (item.type !== "utility") {
      throw new Error(`Item with key ${key} cannot be equipped. Only utility items can be equipped.`);
    }
    if (!user) {
      throw new Error("Invalid user object: Must be provided.");
    }
    if (item.durability <= 0) {
      throw new Error(`Item "${item.name}" is broken and cannot be equipped.`);
    }
    const appliedStats = {};
    for (const [stat, value] of Object.entries(item.stats)) {
      if (value > 0) {
        const setter = `set${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
        if (typeof user[setter] !== "function") {
          throw new Error(`Invalid user object: Must have ${setter} method for stat ${stat}.`);
        }
        const getter = `get${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
        const currentValue = user[getter] ? user[getter]() : 0;
        user[setter](currentValue + value);
        appliedStats[stat] = value;
      }
    }
    item.durability = Math.max(0, item.durability - 10);
    if (item.durability === 0) {
      this.deleteOne(key);
    } else {
      this.inv[this.inv.findIndex((i) => i.key === key)] = item;
    }
    return { equipped: true, item: item.name, stats: appliedStats, durability: item.durability };
  }

  unequipItem(type, stats, user, returnToInventory = false, itemData = {}) {
    if (!["weapon", "armor", "utility"].includes(type)) {
      throw new Error(`Invalid item type: ${type}. Must be weapon, armor, or utility.`);
    }
    if (!user) {
      throw new Error("Invalid user object: Must be provided.");
    }
    const appliedStats = {};
    if (type === "weapon") {
      if (!user.setAtk) {
        throw new Error("Invalid user object: Must have setAtk method.");
      }
      if (stats.atk && stats.atk > 0) {
        const currentAtk = user.getAtk ? user.getAtk() : 0;
        const newAtk = Math.max(0, currentAtk - stats.atk);
        user.setAtk(newAtk);
        appliedStats.atk = stats.atk;
      }
    } else if (type === "armor") {
      if (!user.setDef) {
        throw new Error("Invalid user object: Must have setDef method.");
      }
      if (stats.def && stats.def > 0) {
        const currentDef = user.getDef ? user.getDef() : 0;
        const newDef = Math.max(0, currentDef - stats.def);
        user.setDef(newDef);
        appliedStats.def = stats.def;
      }
    } else if (type === "utility") {
      if (!stats.stats || typeof stats.stats !== "object" || Array.isArray(stats.stats)) {
        throw new Error("Invalid stats: Utility items must provide a stats object.");
      }
      for (const [stat, value] of Object.entries(stats.stats)) {
        if (value > 0) {
          const setter = `set${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
          const getter = `get${stat.charAt(0).toUpperCase() + stat.slice(1)}`;
          if (typeof user[setter] !== "function") {
            throw new Error(`Invalid user object: Must have ${setter} method for stat ${stat}.`);
          }
          const currentValue = user[getter] ? user[getter]() : 0;
          user[setter](Math.max(0, currentValue - value));
          appliedStats[stat] = value;
        }
      }
    }
    let returnedItem = null;
    if (returnToInventory) {
      if (!itemData.key || !itemData.name) {
        throw new Error("Invalid itemData: Must provide key and name for returning to inventory.");
      }
      const newItem = {
        ...itemData,
        type,
        stats: type === "utility" ? stats.stats : { atk: stats.atk || 0, def: stats.def || 0 },
        durability: itemData.durability || 0,
      };
      this.addOne(newItem);
      returnedItem = newItem;
    }
    return { unequipped: true, type, stats: appliedStats, returnedItem };
  }

  repairItem(key, amount = 100) {
    const item = this.getOne(key);
    if (!item) {
      throw new Error(`Item with key ${key} does not exist in the inventory.`);
    }
    if (!["weapon", "armor", "utility"].includes(item.type)) {
      throw new Error(`Item "${item.name}" cannot be repaired. Only weapons, armor, or utility items have durability.`);
    }
    item.durability = Math.min(100, Math.max(0, item.durability + parseInt(String(amount)) || 100));
    this.inv[this.inv.findIndex((i) => i.key === key)] = item;
    return { repaired: true, item: item.name, durability: item.durability };
  }
}

module.exports = Inventory;
