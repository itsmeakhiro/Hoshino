const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const listener = require("./system/listener").default;

const allResolve = new Map();

router.get("/postWReply", async (req, res) => {
  const query = req.query;
  if (!query.senderID) {
    res.json({
      result: {
        body: "❌ Please Enter your senderID on query.",
      },
      status: "error",
    });
    return;
  }

  const rawSenderID = String(query.senderID).replace(/^(web:|custom_)/, "");
  const customSenderID = `custom_${crypto.randomUUID()}`;

  /** @type {HoshinoLia.Event} */
  const event = new Event({ ...query, senderID: customSenderID });
  event.messageID = `id_${crypto.randomUUID()}`;

  const botResponse = await new Promise(async (resolve) => {
    allResolve.set(event.messageID, resolve);
    const apiFake = new Proxy(
      {
        sendMessage(form, _threadID, third) {
          const nform = normalizeMessageForm(form);
          const ll = {
            result: {
              body: nform.body,
              messageID: `id_${crypto.randomUUID()}`,
              timestamp: Date.now().toString(),
            },
            status: "success",
          };
          resolve(ll);
          allResolve.delete(event.messageID);
          if (typeof third === "function") {
            try {
              third(ll);
            } catch (error) {
              console.error(error);
            }
          }
        },
      },
      {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          return (...args) => {
            console.log(
              `Warn: 
    api.${String(prop)}(${args
                .map((i) => `[ ${typeof i} ${i?.constructor?.name || ""} ]`)
                .join(",")}) has no effect!`
            );
          };
        },
      }
    );
    try {
      await listener({ api: apiFake, event });
    } catch (error) {
      console.error(error);
      res.json({
        result: { body: "Error processing request." },
        status: "error",
      });
    }
  });

  res.json(botResponse);
});

function formatIPLegacy(ip, pref = "custom_") {
  try {
    const encodedIP = Buffer.from(ip)
      .toString("base64")
      .replace(/[+/=]/g, (match) => ({ "+": "0", "/": "1", "=": "" }[match]));
    return `${pref}${encodedIP}`;
  } catch (error) {
    return ip;
  }
}

/** @implements {HoshinoLia.Event} */
class Event {
  constructor({ ...info } = {}) {
    this.messageID = "";

    let defaults = {
      body: "",
      senderID: "0",
      threadID: "0",
      messageID: "0",
      type: "message",
      timestamp: Date.now().toString(),
      isGroup: false,
      participantIDs: [],
      attachments: [],
      mentions: {},
      isWeb: true,
    };
    Object.assign(this, defaults, info);
    this.body = defaults.body;
    this.senderID = defaults.senderID;
    this.threadID = defaults.threadID;
    this.messageID = defaults.messageID;
    this.type = defaults.type;
    this.timestamp = defaults.timestamp;
    this.isGroup = defaults.isGroup;
    this.participantIDs = defaults.participantIDs;
    this.attachments = defaults.attachments;
    this.mentions = defaults.mentions;
    this.isWeb = defaults.isWeb;
    this.messageReply = defaults.messageReply;

    this.senderID = formatIPLegacy(this.senderID);
    this.threadID = formatIPLegacy(this.threadID);
    if (this.messageReply?.senderID) {
      this.messageReply.senderID = formatIPLegacy(this.messageReply.senderID);
    }
    this.participantIDs = (this.participantIDs || []).map((id) => formatIPLegacy(id));
    if (Object.keys(this.mentions ?? {}).length > 0) {
      this.mentions = Object.fromEntries(
        Object.entries(this.mentions ?? {}).map((i) => [formatIPLegacy(i[0]), i[1]])
      );
    }
  }
}

function normalizeMessageForm(form) {
  if (!form) {
    return { body: "" };
  }
  let r = typeof form === "string" ? { body: form } : form;
  if (r.attachment && !Array.isArray(r.attachment)) {
    r.attachment = [r.attachment];
  }
  return r;
}

module.exports = router;
