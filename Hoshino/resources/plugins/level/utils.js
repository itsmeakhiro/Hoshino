const fs = require('fs');

class HoshinoUser {
  constructor(allData = {}) {
    this.allData = allData;
    this.mana = allData.mana || 100;
    this.health = allData.health || 100;
  }

  getMana() {
    return this.mana;
  }

  setMana(mana) {
    this.mana = Math.max(0, mana);
    return true;
  }

  getHealth() {
    return this.health;
  }

  setHealth(health) {
    this.health = Math.max(0, health);
    return true;
  }
}

class HoshinoEXP {
  static get abilitiesList() {
    try {
      const data = fs.readFileSync('ability.json', 'utf8');
      return JSON.parse(data);
    } catch (error: Error) {
      console.error('Error loading ability.json:', error.message);
      return {};
    }
  }

  constructor(hoshinoEXP = { exp: 0, mana: 100, health: 100, statPoints: 0 }) {
    this.cxp = this.sanitize(hoshinoEXP);
    this.expControls = new HoshinoEXPControl(this);
    this.activeProtections = [];
  }

  sanitize(data) {
    let { exp, mana, health, statPoints } = data;
    if (isNaN(exp)) {
      exp = 0;
    }
    if (isNaN(mana)) {
      mana = 100;
    }
    if (isNaN(health)) {
      health = 100;
    }
    if (isNaN(statPoints)) {
      statPoints = 0;
    }
    exp = Number.parseInt(String(exp), 10);
    mana = Number.parseInt(String(mana), 10);
    health = Number.parseInt(String(health), 10);
    statPoints = Number.parseInt(String(statPoints), 10);

    return {
      ...data,
      exp,
      mana,
      health,
      statPoints,
    };
  }

  getEXP() {
    return this.cxp.exp;
  }

  setEXP(exp) {
    const previousLevel = this.getLevel();
    this.cxp.exp = exp;
    const newLevel = this.getLevel();
    if (newLevel > previousLevel) {
      this.cxp.statPoints += (newLevel - previousLevel) * 5;
    }
    return true;
  }

  get exp() {
    return this.getEXP();
  }

  set exp(exp) {
    this.setEXP(exp);
  }

  getMana() {
    return this.cxp.mana;
  }

  setMana(mana) {
    this.cxp.mana = Math.max(0, Math.min(mana, this.getMaxMana()));
    return true;
  }

  getMaxMana() {
    return 100 + this.getLevel() * 50 + (this.cxp.maxManaBonus || 0);
  }

  getHealth() {
    return this.cxp.health;
  }

  setHealth(health) {
    this.cxp.health = Math.max(0, Math.min(health, this.getMaxHealth()));
    return true;
  }

  getMaxHealth() {
    return 100 + this.getLevel() * 100 + (this.cxp.maxHealthBonus || 0);
  }

  getLevel() {
    return HoshinoEXP.getLevelFromEXP(this.getEXP());
  }

  setLevel(level) {
    this.setEXP(HoshinoEXP.getEXPFromLevel(level));
    return true;
  }

  get level() {
    return this.getLevel();
  }

  set level(level) {
    this.setLevel(level);
  }

  getNextRemaningEXP() {
    const currentLevel = this.getLevel();
    const currentEXP = this.getEXP();
    const nextLevelEXP = HoshinoEXP.getEXPFromLevel(currentLevel + 1);
    return nextLevelEXP - currentEXP;
  }

  getNextEXP() {
    const currentLevel = this.getLevel();
    const nextLevelEXP = HoshinoEXP.getEXPFromLevel(currentLevel + 1);
    return nextLevelEXP;
  }

  getEXPBeforeLv() {
    const lim = HoshinoEXP.getEXPFromLevel(this.getLevel() - 1);
    return lim;
  }

  getNextEXPCurrentLv() {
    const currentLevel = this.getLevel();
    const nextEXP = this.getNextEXP();
    const levelEXP = HoshinoEXP.getEXPFromLevel(currentLevel - 1);
    return nextEXP - levelEXP;
  }

  getEXPCurrentLv() {
    const lim = HoshinoEXP.getEXPFromLevel(this.getLevel() - 1);
    return this.getEXP() - lim;
  }

  raw() {
    return JSON.parse(JSON.stringify(this.cxp));
  }

  getRankString() {
    return HoshinoEXP.rankNames[
      Math.max(0, Math.min(this.getLevel() - 1, HoshinoEXP.rankNames.length - 1))
    ];
  }

  expReached(exp) {
    return this.getEXP() >= exp;
  }

  levelReached(level) {
    return this.getLevel() >= level;
  }

  getStatPoints() {
    return this.cxp.statPoints;
  }

  spendStatPoints(points) {
    if (points > this.cxp.statPoints) {
      throw new Error("Not enough stat points.");
    }
    this.cxp.statPoints -= points;
    return true;
  }

  upgradeMaxHealth(points) {
    if (points > this.cxp.statPoints) {
      throw new Error("Not enough stat points.");
    }
    this.cxp.maxHealthBonus = (this.cxp.maxHealthBonus || 0) + points * 10;
    this.spendStatPoints(points);
    return true;
  }

  upgradeMaxMana(points) {
    if (points > this.cxp.statPoints) {
      throw new Error("Not enough stat points.");
    }
    this.cxp.maxManaBonus = (this.cxp.maxManaBonus || 0) + points * 5;
    this.spendStatPoints(points);
    return true;
  }

  unlockAbility(abilityName) {
    const ability = HoshinoEXP.abilitiesList[abilityName];
    if (!ability) {
      throw new Error(`Ability ${abilityName} does not exist in ability.json.`);
    }
    this.cxp.abilities = this.cxp.abilities || {};
    if (this.cxp.abilities[abilityName]) {
      throw new Error(`Ability ${abilityName} already unlocked.`);
    }
    const cost = ability.statPointCost;
    if (cost > this.cxp.statPoints) {
      throw new Error("Not enough stat points to unlock this ability.");
    }
    this.cxp.abilities[abilityName] = { ...ability, unlocked: true };
    this.spendStatPoints(cost);
    return true;
  }

  getAbilities() {
    return Object.values(this.cxp.abilities || {});
  }

  useAbility(abilityName, target = null) {
    const ability = (this.cxp.abilities || {})[abilityName];
    if (!ability) {
      throw new Error(`Ability ${abilityName} is not unlocked.`);
    }

    const result = { damage: 0, protection: null };

    if (ability.damageType && ability.damage > 0) {
      result.damage = ability.damage;
      const manaCost = ability.damageType === "stronger" ? 20 : 10;
      if (this.cxp.mana < manaCost) {
        throw new Error("Not enough mana to use this ability.");
      }
      this.cxp.mana -= manaCost;
    }

    if (ability.protection) {
      const protection = {
        type: ability.protection.type,
        value: ability.protection.value,
        duration: ability.protection.duration,
        turnsRemaining: ability.protection.duration,
      };
      this.activeProtections.push(protection);
      result.protection = protection;
    }

    return result;
  }

  updateProtections() {
    this.activeProtections = this.activeProtections
      .map((protection) => ({
        ...protection,
        turnsRemaining: protection.turnsRemaining - 1,
      }))
      .filter((protection) => protection.turnsRemaining > 0);
  }

  getActiveProtections() {
    return this.activeProtections;
  }

  applyDamage(damage) {
    let remainingDamage = damage;
    for (let i = this.activeProtections.length - 1; i >= 0; i--) {
      if (this.activeProtections[i].type === "health") {
        const shield = this.activeProtections[i];
        const absorbed = Math.min(shield.value, remainingDamage);
        shield.value -= absorbed;
        remainingDamage -= absorbed;
        if (shield.value <= 0) {
          this.activeProtections.splice(i, 1);
        }
      }
    }
    this.cxp.health = Math.max(0, this.cxp.health - remainingDamage);
    return remainingDamage;
  }

  applyManaCost(manaCost) {
    let remainingCost = manaCost;
    for (let i = this.activeProtections.length - 1; i >= 0; i--) {
      if (this.activeProtections[i].type === "mana") {
        const shield = this.activeProtections[i];
        const absorbed = Math.min(shield.value, remainingCost);
        shield.value -= absorbed;
        remainingCost -= absorbed;
        if (shield.value <= 0) {
          this.activeProtections.splice(i, 1);
        }
      }
    }
    this.cxp.mana = Math.max(0, this.cxp.mana - remainingCost);
    return remainingCost;
  }

  static getEXPFromLevel(level) {
    if (level <= 1) {
      return 0;
    } else {
      return 10 * Math.pow(2, level - 1);
    }
  }

  static getLevelFromEXP(lastExp) {
    return lastExp < 10 ? 1 : Math.floor(Math.log2(lastExp / 10)) + 1;
  }

  static rankNames = [
    "Academy Student",
    "Genin",
    "Chunin",
    "Jonin",
    "Elite Jonin",
    "Anbu",
    "Anbu Captain",
    "Kage Apprentice",
    "Kage",
    "Legendary Kage",
    "Hunter",
    "Rogue Hunter",
    "Master Hunter",
    "Nen User",
    "Nen Master",
    "Star Hunter",
    "Double-Star Hunter",
    "Triple-Star Hunter",
    "Hero Trainee",
    "Class-C Hero",
    "Class-B Hero",
    "Class-A Hero",
    "Class-S Hero",
    "Top-Class Hero",
    "Hashira",
    "Tsuguko",
    "Demon Slayer",
    "Upper Moon",
    "Lower Moon",
    "Demon King",
    "Mage Apprentice",
    "Mage",
    "High Mage",
    "Archmage",
    "Wizard",
    "Grand Wizard",
    "Sorcerer",
    "Great Sorcerer",
    "Sage",
    "Great Sage",
    "Shinobi",
    "Elite Shinobi",
    "Shadow Shinobi",
    "Phantom Shinobi",
    "Samurai",
    "Master Samurai",
    "Shogun",
    "Legendary Shogun",
    "Alchemist",
    "State Alchemist",
    "Homunculus",
    "Philosopher",
    "Espada",
    "Arrancar",
    "Captain",
    "Soul Reaper",
    "Zero Division",
    " Quincy",
    "Sternritter",
    "Grandmaster Quincy",
    "Pirate",
    "Pirate Captain",
    "Yonko",
    "Admiral",
    "Fleet Admiral",
    "Haki User",
    "Haki Master",
    "Devil Fruit User",
    "Awakened User",
    "Titan",
    "Titan Shifter",
    "Scout",
    "Scout Captain",
    "Warrior",
    "Eldian",
    "Marleyan",
    "Coordinate",
    "Exorcist",
    "Meister",
    "Weapon",
    "Death Scythe",
    "Shinigami",
    "True Shinigami",
    "Paladin",
    "Holy Knight",
    "Commandment",
    "Archangel",
    "Goddess",
    "Demon",
    "Demon Lord",
    "Overlord",
    "Dragon Slayer",
    "Dragon Tamer",
    "Dragon King",
    "Fairy",
    "Fairy King",
    "Celestial Mage",
    "Celestial King",
    "Spirit",
    "Spirit King",
    "Beast Tamer",
    "Beast King",
    "Summoner",
    "Grand Summoner",
    "Necromancer",
    "Lich",
    "Vampire",
    "Vampire Lord",
    "Werewolf",
    "Alpha Werewolf",
    "Esper",
    "Level 5 Esper",
    "Magical Girl",
    "Puella Magi",
    "Witch",
    "Archwitch",
    "Time Traveler",
    "Chrono Master",
    "Alchemical Sage",
    "Star Mage",
    "Cosmic Ninja",
    "Void Walker",
    "Astral Samurai",
    "Eclipse Hunter",
    "Dawn Slayer",
    "Twilight Sage",
    "Stellar Shinobi",
    "Lunar Kage",
    "Solar Kage",
    "Galactic Hero",
    "Nova Sorcerer",
    "Abyssal Demon",
    "Ethereal Spirit",
    "Primal Dragon",
    "Aether Mage",
    "Chaos Alchemist",
    "Order Paladin",
    "Infinity Summoner",
    "Eternal Exorcist",
    "Divine Shinigami",
    "Mythic Pirate",
    "Cosmic Yonko",
    "Starlight Quincy",
    "Nebula Reaper",
    "Aurora Samurai",
    "Celestial Overlord",
    "Void Shogun",
    "Eclipse Kage",
    "Astral Hashira",
    "Nova Slayer",
    "Chrono Sorcerer",
    "Ethereal Sage",
    "Primal Shinobi",
    "Galactic Alchemist",
    "Stellar Demon",
    "Lunar Hero",
    "Solar Mage",
    "Abyssal Slayer",
    "Cosmic Kage",
    "Aether Ninja",
    "Chaos Sage",
    "Order Alchemist",
    "Infinity Shinobi",
    "Eternal Sorcerer",
    "Divine Hero"
  ];
}

class HoshinoEXPControl {
  constructor(parent = new HoshinoEXP()) {
    this.parent = parent;
  }

  get exp() {
    return this.parent.exp;
  }

  set exp(expp) {
    this.parent.exp = expp;
  }

  raise(expAmount) {
    this.exp += expAmount;
  }

  decrease(expAmount) {
    this.exp -= expAmount;
  }

  raiseToLevel(level) {
    const targetEXP = HoshinoEXP.getEXPFromLevel(level);
    this.exp = targetEXP;
  }

  raiseTo(targetEXP) {
    this.exp = targetEXP;
  }

  raiseWithLevel(level) {
    const baseEXP = HoshinoEXP.getEXPFromLevel(level);
    this.exp = baseEXP + this.exp;
  }

  retrieve() {
    return this.exp;
  }

  getLevel() {
    return HoshinoEXP.getLevelFromEXP(this.exp);
  }

  get mana() {
    return this.parent.getMana();
  }

  set mana(mana) {
    this.parent.setMana(mana);
  }

  increaseMana(amount) {
    this.mana += amount;
  }

  decreaseMana(amount) {
    this.mana -= amount;
  }

  restoreMana() {
    this.mana = this.parent.getMaxMana();
  }

  get health() {
    return this.parent.getHealth();
  }

  set health(health) {
    this.parent.setHealth(health);
  }

  increaseHealth(amount) {
    this.health += amount;
  }

  decreaseHealth(amount) {
    this.health -= amount;
  }

  restoreHealth() {
    this.health = this.parent.getMaxHealth();
  }

  getStatPoints() {
    return this.parent.getStatPoints();
  }

  upgradeMaxHealth(points) {
    return this.parent.upgradeMaxHealth(points);
  }

  upgradeMaxMana(points) {
    return this.parent.upgradeMaxMana(points);
  }

  unlockAbility(abilityName) {
    return this.parent.unlockAbility(abilityName);
  }

  getAbilities() {
    return this.parent.getAbilities();
  }

  useAbility(abilityName, target = null) {
    return this.parent.useAbility(abilityName, target);
  }

  updateProtections() {
    return this.parent.updateProtections();
  }

  getActiveProtections() {
    return this.parent.getActiveProtections();
  }

  applyDamage(damage) {
    return this.parent.applyDamage(damage);
  }

  applyManaCost(manaCost) {
    return this.parent.applyManaCost(manaCost);
  }
}

class HoshinoQuest {
  constructor(quests = {}) {
    this.quests = quests;
  }

  raw() {
    return JSON.parse(JSON.stringify(this.quests));
  }

  newQuest(questKey, name, description, totalSteps = 10) {
    if (this.quests[questKey]) {
      throw new Error(`Quest with key ${questKey} already exists.`);
    }
    this.quests[questKey] = {
      name,
      description,
      currentSteps: 0,
      totalSteps,
      isComplete: false,
    };
  }

  deleteQuest(questKey) {
    if (!this.quests[questKey]) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    delete this.quests[questKey];
  }

  complete(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    if (!quest.isComplete) {
      throw new Error(
        `Quest with key ${questKey} is not complete and cannot be deleted.`
      );
    }
    this.deleteQuest(questKey);
  }

  advance(questKey, steps = 1) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    quest.currentSteps += steps;
    quest.isComplete = quest.currentSteps >= quest.totalSteps;
  }

  isComplete(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return quest.isComplete;
  }

  has(questKey) {
    return !!this.quests[questKey];
  }

  advanceIfHas(questKey, steps = 1) {
    if (!this.has(questKey)) {
      return;
    }
    this.advance(questKey, steps);
  }

  getInfo(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return {
      name: quest.name,
      description: quest.description,
      currentSteps: quest.currentSteps,
      totalSteps: quest.totalSteps,
      isComplete: quest.isComplete,
    };
  }

  getCurrentSteps(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return quest.currentSteps;
  }

  getStepsTotal(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    return quest.totalSteps;
  }

  setTotalSteps(questKey, totalSteps) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    quest.totalSteps = totalSteps;
  }

  reset(questKey) {
    const quest = this.quests[questKey];
    if (!quest) {
      throw new Error(`Quest with key ${questKey} does not exist.`);
    }
    quest.currentSteps = 0;
    quest.isComplete = false;
  }
}

module.exports = {
  HoshinoUser,
  HoshinoEXP,
  HoshinoQuest,
};
