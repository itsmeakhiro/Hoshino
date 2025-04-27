class HoshinoUser {
  constructor(allData = {}) {
    this.allData = allData;
  }
}

class HoshinoEXP {
  constructor(hoshinoEXP = { exp: 0 }) {
    this.cxp = this.sanitize(hoshinoEXP);
    this.expControls = new HoshinoEXPControl(this);
  }

  sanitize(data) {
    let { exp } = data;
    if (isNaN(exp)) {
      exp = 0;
    }
    exp = Number.parseInt(String(exp), 10);

    return {
      ...data,
      exp,
    };
  }

  getEXP() {
    return this.cxp.exp;
  }

  setEXP(exp) {
    this.cxp.exp = exp;
    return true;
  }

  get exp() {
    return this.getEXP();
  }

  set exp(exp) {
    this.setEXP(exp);
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
    "Abyssal Hunter",
    "Cosmic Dragon",
    "Aether Samurai",
    "Chaos Reaper",
    "Order Shinigami",
    "Infinity Slayer",
    "Eternal Kage",
    "Divine Yonko",
    "Mythic Sorcerer",
    "Starlight Paladin",
    "Nebula Ninja",
    "Aurora Mage",
    "Celestial Shogun",
    "Void Hero",
    "Eclipse Summoner",
    "Astral Dragon",
    "Nova Shinobi",
    "Chrono Slayer",
    "Ethereal Alchemist",
    "Primal Sage",
    "Galactic Reaper",
    "Stellar Kage",
    "Lunar Demon",
    "Solar Quincy",
    "Abyssal Samurai",
    "Cosmic Exorcist",
    "Aether Shinigami",
    "Chaos Hero",
    "Order Sorcerer",
    "Infinity Mage",
    "Eternal Hashira",
    "Divine Pirate",
    "Mythic Ninja",
    "Starlight Slayer",
    "Nebula Sage",
    "Aurora Dragon",
    "Celestial Alchemist",
    "Void Kage",
    "Eclipse Shinobi",
    "Astral Hero",
    "Nova Summoner",
    "Chrono Samurai",
    "Ethereal Quincy",
    "Primal Shinigami",
    "Galactic Sorcerer",
    "Stellar Overlord",
    "Lunar Mage",
    "Solar Demon",
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
    true;
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
  HoshinoQuest
};
