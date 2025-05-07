const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const listener = require("./system/listener").default;

const allResolve = new Map();

router.get("/postWReply", async (req, res) => {
  if (!req.query.senderID) {
    res.json({
      result: {
        body: "❌ Please Enter your senderID on query. it allows any idenfitiers, please open your code.",
      },
      status: "success",
    });
    return;
  }
  const event = new Event(req.query ?? {});
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
      // @ts-ignore
      await listener({ api: apiFake, event });
    } catch (error) {
      console.error(error);
    }
  });

  res.json(botResponse);
});

function formatIP(ip) {
  try {
    ip = ip?.replaceAll("custom_", "");
    const encodedIP = Buffer.from(ip)
      .toString("base64")
      .replace(/[+/=]/g, (match) => ({ "+": "0", "/": "1", "=": "" }[match]));
    return encodedIP;
  } catch (error) {
    console.error("Error in formatting IP:", error);
    return ip;
  }
}

class Event {
  constructor(info = {}) {
    this.messageID = undefined;

    const defaults = {
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
    };

    const safeInfo = typeof info === "object" && info !== null ? info : {};

    Object.assign(this, defaults, safeInfo);

    this.originalSenderID = this.senderID;
    this.originalThreadID = this.threadID;
    this.originalParticipantIDs = this.participantIDs ? [...this.participantIDs] : [];
    this.originalMentions = this.mentions ? { ...this.mentions } : {};

    if (this.messageReply && typeof this.messageReply === "object") {
      this.originalMessageReplySenderID = this.messageReply.senderID;
      this.messageReply.senderID = formatIP(this.messageReply.senderID);
    }

    // Apply formatIP to generate custom IDs
    this.senderID = formatIP(this.senderID);
    this.threadID = formatIP(this.threadID);
    this.participantIDs = this.participantIDs ? this.participantIDs.map((id) => formatIP(id)) : [];

    if (Object.keys(this.mentions).length > 0) {
      this.mentions = Object.fromEntries(
        Object.entries(this.mentions).map((i) => [formatIP(i[0]), i[1]])
      );
    }
  }
}

module.exports = router;

function normalizeMessageForm(form) {
  let r = {};
  if (form && r) {
    if (typeof form === "object") {
      r = form;
    }

    if (typeof form === "string") {
      // @ts-ignore
      r = {
        body: form,
      };
    }
    if (!Array.isArray(r.attachment) && r.attachment) {
      r.attachment = [r.attachment];
    }
    return r;
  } else {
    return {
      body: undefined,
    };
  }
}
