// Disclaimer: This code is related to CassidyRedux(https://github.com/lianecagara/CassidyRedux) developed by: Liane Cagara, do not intend to change this code

const LiaMongo = require("lia-mongo");

class UserStatsManager {
  /**
   * @type {string | undefined}
   */
  #uri;
  constructor({ uri = process.env.MONGO_URI } = {}) {
    this.defaults = {
      balance: 0,
      username: null,
    };
    this.mongo = null;
    this.#uri = uri ?? process.env.MONGO_URI;
    if (!this.#uri) {
      throw new Error("Missing MongoDB URI");
    }
    this.mongo = new LiaMongo({
      uri: this.#uri,
      collection: "tokitoDB",
    });
    this.cache = {};
  }

  updateCache(key, value) {
    this.cache[key] = value;
  }

  process(data) {
    data = data || {};
    data.balance = typeof data.balance === "number" ? data.balance : 0;
    if (data.balance > Number.MAX_SAFE_INTEGER) {
      data.balance = Number.MAX_SAFE_INTEGER;
    }
    if (data.username) {
      data.username = data.username.trim();
    }
    return data;
  }

  async connect() {
    try {
      await this.mongo.start();
      await this.mongo.put("test", this.defaults);
    } catch (error) {
      console.error("MONGODB Error:", error);
      throw error;
    }
  }

  async getCache(key) {
    if (!this.cache[key]) {
      await this.get(key);
    }
    return JSON.parse(JSON.stringify(this.cache[key]));
  }

  async get(key) {
    const data = await this.process(
      (await this.mongo.get(key)) || {
        ...this.defaults,
        lastModified: Date.now(),
      }
    );
    this.updateCache(key, data);
    return data;
  }

  async deleteUser(key) {
    await this.mongo.remove(key);
    return this.getAll();
  }

  async remove(key, removedProperties = []) {
    const user = await this.get(key);
    for (const item of removedProperties) {
      delete user[item];
    }
    await this.mongo.put(key, user);
    this.updateCache(key, user);
    return this.getAll();
  }

  async set(key, updatedProperties = {}) {
    const user = await this.get(key);
    const updatedUser = {
      ...user,
      ...updatedProperties,
      lastModified: Date.now(),
    };
    await this.mongo.bulkPut({ [key]: updatedUser });
    this.updateCache(key, updatedUser);
  }

  async getAllOld() {
    return await this.mongo.toObject();
  }

  async getAll() {
    const allData = await this.getAllOld();
    const result = {};
    for (const key in allData) {
      result[key] = this.process(allData[key]);
      this.cache[key] = result[key];
    }
    return result;
  }

  async toLeanObject() {
    try {
      const results = await this.mongo.KeyValue.find({}, "key value").lean();
      const resultObj = {};
      results.forEach((doc) => {
        resultObj[doc.key] = doc.value;
      });
      return resultObj;
    } catch (error) {
      if (this.mongo.ignoreError) {
        console.error("Error getting entries:", error);
        return {};
      } else {
        throw error;
      }
    }
  }
}

module.exports = UserStatsManager;